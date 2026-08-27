// ═══════════════════════════════════════════════════════════════════════════
//  PayPal - gift card purchase
// ═══════════════════════════════════════════════════════════════════════════
// Flow: createGiftCardOrder (callable) → redirect the buyer to PayPal → buyer
// returns to /gift-card/complete → captureGiftCardOrder (callable) issues the
// card. paypalWebhook is the safety net for buyers who close the tab before
// the return redirect fires. Either path may run first, and issueGiftCard is
// idempotent, so whichever loses the race is a no-op.
//
// Kept out of index.js deliberately: this is the only code in the project that
// moves money, and it should be readable on its own.

const PAYPAL_LIVE = process.env.PAYPAL_ENV === 'live';
const PAYPAL_API = PAYPAL_LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const PAYPAL_CURRENCY = 'CAD';

// Where the buyer comes back to. Must be the public origin the site is served
// from, not the Firebase Hosting default.
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://barpupko.github.io/PlanYourTripNow').replace(/\/$/, '');

// Guard rails on a buyer-chosen amount.
const GIFT_CARD_MIN = 25;
const GIFT_CARD_MAX = 2000;

// Money as a string, always - never let a float round-trip decide what was charged.
const toAmountString = (n) => Number(n).toFixed(2);

const validGiftCardAmount = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 100) / 100;
  if (rounded < GIFT_CARD_MIN || rounded > GIFT_CARD_MAX) return null;
  return rounded;
};

const looksLikeEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

module.exports = ({ admin, functions, transporter, adminEmail }) => {
  const paypalCreds = () => {
    const id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!id || !secret) {
      throw new functions.https.HttpsError('failed-precondition', 'PayPal is not configured');
    }
    return Buffer.from(`${id}:${secret}`).toString('base64');
  };

  const paypalToken = async () => {
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${paypalCreds()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const body = await res.json();
    if (!res.ok) {
      console.error('[paypal] token failed:', res.status, body);
      throw new functions.https.HttpsError('internal', 'PayPal authentication failed');
    }
    return body.access_token;
  };

  const paypalFetch = async (path, { method = 'POST', body, requestId } = {}) => {
    const token = await paypalToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    // Idempotency: PayPal replays the original result instead of charging twice.
    if (requestId) headers['PayPal-Request-Id'] = requestId;

    const res = await fetch(`${PAYPAL_API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : {} };
  };

  const sendGiftCardEmails = async (docId, card) => {
    const link = `${SITE_URL}/gift/${docId}`;
    const amount = toAmountString(card.amount);
    const recipientName = escapeHtml(card.recipientName);
    const senderName = escapeHtml(card.senderName);
    const message = escapeHtml(card.message);

    await transporter.sendMail({
      from: `IVRITours <${process.env.EMAIL_USER}>`,
      to: card.recipientEmail,
      subject: `${card.senderName} sent you a C$${amount} IVRITours gift card!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#00BCD4">You've received a gift card!</h2>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> has sent you a
             <strong>C$${amount}</strong> gift card for IVRITours.</p>
          ${message ? `<blockquote style="border-left:3px solid #00BCD4;padding-left:12px;color:#555">${message}</blockquote>` : ''}
          <p style="margin:28px 0">
            <a href="${link}" style="background:#00BCD4;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              View your gift card
            </a>
          </p>
          <p style="color:#888;font-size:13px">Gift card code: ${card.barcodeId}</p>
        </div>`,
    });

    await transporter.sendMail({
      from: `IVRITours <${process.env.EMAIL_USER}>`,
      to: card.senderEmail,
      subject: `Your C$${amount} gift card to ${card.recipientName} is on its way`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#00BCD4">Thank you for your purchase</h2>
          <p>Hi ${senderName},</p>
          <p>Your <strong>C$${amount}</strong> gift card has been emailed to
             ${recipientName} at ${escapeHtml(card.recipientEmail)}.</p>
          <p style="color:#888;font-size:13px">Gift card code: ${card.barcodeId}</p>
        </div>`,
    });

    await transporter.sendMail({
      from: `IVRITours <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Gift card sold - C$${amount}`,
      html: `<p>C$${amount} gift card purchased by ${senderName} (${escapeHtml(card.senderEmail)})
             for ${recipientName} (${escapeHtml(card.recipientEmail)}).</p>
             <p>Code: ${card.barcodeId}<br/>Link: ${link}</p>`,
    });
  };

  /**
   * Marks a pending gift card paid and issues it. Safe to call more than once:
   * the transaction is the single point that decides whether this call is the
   * one that issues, so the return redirect and the webhook can both fire
   * without producing two cards or two emails.
   */
  const issueGiftCard = async (docId, capture) => {
    const ref = admin.firestore().collection('giftCards').doc(docId);

    const issued = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        console.error('[paypal] gift card doc missing:', docId);
        return null;
      }
      const data = snap.data();
      if (data.status === 'paid') return null; // already issued

      // The capture is authoritative. If PayPal took a different amount than
      // the doc says, do not issue - flag it for a human instead.
      if (capture && toAmountString(data.amount) !== toAmountString(capture.amount)) {
        console.error('[paypal] amount mismatch on', docId, data.amount, '!=', capture.amount);
        tx.update(ref, {
          status: 'amount_mismatch',
          paypalCaptureId: capture.captureId || null,
          paypalCapturedAmount: capture.amount || null,
        });
        return null;
      }

      const barcodeId = `IVRI${Date.now()}${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
      tx.update(ref, {
        status: 'paid',
        paid: true,
        paidAt: admin.firestore.Timestamp.now(),
        barcodeId,
        paypalCaptureId: capture ? capture.captureId || null : null,
      });
      return { ...data, barcodeId };
    });

    if (!issued) return; // duplicate delivery, or a mismatch we refused to issue

    try {
      await sendGiftCardEmails(docId, issued);
    } catch (e) {
      // The card is paid for and valid - an email failure must not fail the
      // capture. Log loudly so it can be resent by hand.
      console.error('[paypal] gift card issued but email failed:', docId, e.message);
    }
  };

  /**
   * Creates the pending gift card and a matching PayPal order.
   * Returns the URL to redirect the buyer to.
   */
  const createGiftCardOrder = functions.https.onCall(async (data) => {
    const amount = validGiftCardAmount(data && data.amount);
    if (amount === null) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Gift card amount must be between C$${GIFT_CARD_MIN} and C$${GIFT_CARD_MAX}`
      );
    }

    const recipientName = (data.recipientName || '').trim();
    const senderName = (data.senderName || '').trim();
    const recipientEmail = (data.recipientEmail || '').trim();
    const senderEmail = (data.senderEmail || '').trim();
    const message = (data.message || '').trim().slice(0, 500);

    if (!recipientName || !senderName) {
      throw new functions.https.HttpsError('invalid-argument', 'Both names are required');
    }
    if (!looksLikeEmail(recipientEmail) || !looksLikeEmail(senderEmail)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'A valid email is required for both sender and recipient'
      );
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Written as pending. firestore.rules keeps unpaid cards unreadable, and
    // issueGiftCard is the only thing that ever flips status to 'paid'.
    const ref = await admin.firestore().collection('giftCards').add({
      amount,
      currency: PAYPAL_CURRENCY,
      recipientName,
      recipientEmail,
      senderName,
      senderEmail,
      message,
      status: 'pending',
      paid: false,
      redeemed: false,
      viewed: false,
      paymentMethod: 'paypal',
      expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
      createdAt: admin.firestore.Timestamp.now(),
    });

    const order = await paypalFetch('/v2/checkout/orders', {
      requestId: `giftcard-${ref.id}`,
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: ref.id,
          custom_id: ref.id, // how the capture and webhook find their way back
          description: `IVRITours gift card for ${recipientName}`.slice(0, 127),
          amount: { currency_code: PAYPAL_CURRENCY, value: toAmountString(amount) },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'IVRITours',
              locale: data.language === 'ru' ? 'ru-RU' : 'en-CA',
              // Buyers here want to pay by card, so open on the card form
              // rather than the PayPal login.
              landing_page: 'GUEST_CHECKOUT',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: `${SITE_URL}/gift-card/complete`,
              cancel_url: `${SITE_URL}/gift-card-purchase?cancelled=1`,
            },
          },
        },
      },
    });

    if (!order.ok) {
      console.error('[paypal] create order failed:', order.status, JSON.stringify(order.body));
      await ref.update({ status: 'order_failed' });
      throw new functions.https.HttpsError('internal', 'Could not start the PayPal checkout');
    }

    const links = order.body.links || [];
    // payer-action is returned when experience_context is used; approve is the
    // classic equivalent. Accept either so this survives a PayPal change.
    const redirect = links.find((l) => l.rel === 'payer-action') ||
                     links.find((l) => l.rel === 'approve');
    if (!redirect) {
      console.error('[paypal] no redirect link in order:', JSON.stringify(order.body));
      throw new functions.https.HttpsError('internal', 'PayPal did not return a checkout link');
    }

    await ref.update({ paypalOrderId: order.body.id });
    return { redirectUrl: redirect.href, giftCardId: ref.id };
  });

  /**
   * Captures an approved order. Called by the page the buyer lands on when
   * PayPal redirects them back.
   */
  const captureGiftCardOrder = functions.https.onCall(async (data) => {
    const orderId = data && data.orderId;
    if (!orderId || typeof orderId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'orderId is required');
    }

    const res = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      requestId: `capture-${orderId}`,
    });

    // ORDER_ALREADY_CAPTURED means the webhook beat us here. From the buyer's
    // point of view that is a success, so fall through to the lookup.
    const alreadyCaptured = res.status === 422 &&
      JSON.stringify(res.body).includes('ORDER_ALREADY_CAPTURED');

    if (!res.ok && !alreadyCaptured) {
      console.error('[paypal] capture failed:', res.status, JSON.stringify(res.body));
      throw new functions.https.HttpsError('internal', 'Payment could not be completed');
    }

    if (res.ok) {
      if (res.body.status !== 'COMPLETED') {
        throw new functions.https.HttpsError('failed-precondition', `Payment status: ${res.body.status}`);
      }
      const unit = (res.body.purchase_units || [])[0] || {};
      const captureNode = ((unit.payments || {}).captures || [])[0] || {};
      const giftCardId = captureNode.custom_id || unit.custom_id || unit.reference_id;

      if (!giftCardId) {
        console.error('[paypal] captured order has no custom_id:', JSON.stringify(res.body));
        throw new functions.https.HttpsError('internal', 'Payment captured but the order could not be matched');
      }

      await issueGiftCard(giftCardId, {
        captureId: captureNode.id,
        amount: (captureNode.amount || {}).value,
      });
      return { giftCardId };
    }

    // Already captured - find the doc by the order id stored at creation.
    const found = await admin.firestore()
      .collection('giftCards')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();
    if (found.empty) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    return { giftCardId: found.docs[0].id };
  });

  /**
   * Safety net. The buyer may never load the return page - they can close the
   * tab the moment PayPal takes the money - so this is what guarantees a paid
   * card actually gets issued.
   */
  const paypalWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('[paypal] PAYPAL_WEBHOOK_ID not set - refusing unverified webhook');
      res.status(500).send('Webhook not configured');
      return;
    }

    try {
      const verify = await paypalFetch('/v1/notifications/verify-webhook-signature', {
        body: {
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: req.body,
        },
      });

      if (!verify.ok || verify.body.verification_status !== 'SUCCESS') {
        console.error('[paypal] webhook signature rejected:', JSON.stringify(verify.body));
        res.status(400).send('Invalid signature');
        return;
      }

      const event = req.body || {};
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource || {};
        const giftCardId = resource.custom_id;
        if (giftCardId) {
          await issueGiftCard(giftCardId, {
            captureId: resource.id,
            amount: (resource.amount || {}).value,
          });
        } else {
          console.warn('[paypal] capture completed with no custom_id:', resource.id);
        }
      }

      // Always 200 on a verified event we understood - anything else makes
      // PayPal retry a delivery we already handled.
      res.status(200).send('OK');
    } catch (e) {
      console.error('[paypal] webhook error:', e);
      res.status(500).send('Error');
    }
  });

  return { createGiftCardOrder, captureGiftCardOrder, paypalWebhook };
};
