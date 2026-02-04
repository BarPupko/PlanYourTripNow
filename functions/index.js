const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Admin email configuration
const ADMIN_EMAIL = 'ivristats@gmail.com';

// Configure email transporter
// IMPORTANT: Replace with your email service credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: functions.config().email?.user || 'your-email@gmail.com',
    pass: functions.config().email?.pass || 'your-app-password'
  }
});

/**
 * Generates a PDF waiver with user information and signature
 */
async function generateWaiverPDF(registration, trip) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('TRIP WAIVER & REGISTRATION', { align: 'center' });
    doc.moveDown();

    // Trip Information
    doc.fontSize(14).font('Helvetica-Bold').text('Trip Information');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Trip: ${trip.title}`);
    doc.text(`Date: ${trip.date.toDate().toLocaleDateString()}`);
    doc.moveDown();

    // Participant Information
    doc.fontSize(14).font('Helvetica-Bold').text('Participant Information');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Name: ${registration.firstName} ${registration.lastName}`);
    doc.text(`Email: ${registration.email}`);
    doc.text(`Phone: ${registration.phone}`);
    doc.text(`Seat Number: ${registration.seatNumber}`);
    doc.moveDown();

    // Cancellation Policy
    doc.fontSize(14).font('Helvetica-Bold').text('Cancellation Policy');
    doc.fontSize(10).font('Helvetica');
    doc.text(
      '1. Cancellations made 30 days or more before the trip date will receive a full refund.\n' +
      '2. Cancellations made 15-29 days before the trip date will receive a 50% refund.\n' +
      '3. Cancellations made less than 15 days before the trip date are non-refundable.\n' +
      '4. No-shows on the trip date are non-refundable.\n' +
      '5. Trip organizers reserve the right to cancel trips due to weather, safety concerns, or insufficient participation.'
    );
    doc.moveDown();

    // Waiver of Liability
    doc.fontSize(14).font('Helvetica-Bold').text('Waiver of Liability and Assumption of Risk');
    doc.fontSize(10).font('Helvetica');
    doc.text(
      'I, the undersigned, hereby acknowledge that I am voluntarily participating in this trip and related activities. ' +
      'I understand that such participation involves inherent risks, including but not limited to personal injury, property damage, or death.\n\n' +
      'In consideration of being permitted to participate in this trip, I hereby:\n\n' +
      '1. WAIVE, RELEASE, AND DISCHARGE the trip organizers, their officers, employees, and agents from any and all liability.\n' +
      '2. ASSUME ALL RISKS associated with participation in this trip, whether known or unknown.\n' +
      '3. AGREE TO INDEMNIFY AND HOLD HARMLESS the trip organizers from any claims, actions, or losses.\n' +
      '4. CONSENT to receive emergency medical treatment if necessary.\n\n' +
      'I have read this waiver, fully understand its terms, and sign it freely and voluntarily.'
    );
    doc.moveDown();

    // Signature Section
    doc.fontSize(11).font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Add signature image if available
    if (registration.signatureUrl) {
      doc.fontSize(11).font('Helvetica-Bold').text('Digital Signature:');
      doc.moveDown(0.5);

      // Note: In a production environment, you would fetch and embed the signature image
      // For now, we'll just indicate it's been signed
      doc.fontSize(10).font('Helvetica-Oblique');
      doc.text('[Digital signature on file]');
      doc.text(`Signature URL: ${registration.signatureUrl}`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text(
      `Generated on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    doc.end();
  });
}

/**
 * Cloud Function triggered when a new registration is created
 * Generates PDF and sends emails to participant and admin
 */
exports.onRegistrationCreated = functions.firestore
  .document('registrations/{registrationId}')
  .onCreate(async (snap, context) => {
    const registration = snap.data();
    const registrationId = context.params.registrationId;

    try {
      // Get trip details
      const tripDoc = await admin.firestore().collection('trips').doc(registration.tripId).get();

      if (!tripDoc.exists) {
        console.error('Trip not found:', registration.tripId);
        return null;
      }

      const trip = tripDoc.data();

      // Generate PDF
      console.log('Generating PDF for registration:', registrationId);
      const pdfBuffer = await generateWaiverPDF(registration, trip);

      // Upload PDF to Storage
      const bucket = admin.storage().bucket();
      const pdfFileName = `waivers/${registration.tripId}/${registrationId}.pdf`;
      const file = bucket.file(pdfFileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            registrationId: registrationId,
            tripId: registration.tripId
          }
        }
      });

      // Make the file publicly accessible (optional, or use signed URLs)
      await file.makePublic();
      const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfFileName}`;

      // Update registration with PDF URL
      await snap.ref.update({ pdfUrl });

      // Send email to participant
      await transporter.sendMail({
        from: '"IVRI Tours" <noreply@ivritours.com>',
        to: registration.email,
        subject: `✅ Registration Confirmed: ${trip.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">✅ Registration Confirmed!</h1>
            </div>
            <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Dear ${registration.firstName} ${registration.lastName},</p>
              <p style="font-size: 16px;">Thank you for registering for <strong style="color: #00BCD4;">${trip.title}</strong>!</p>

              <div style="background-color: #E0F7FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #00BCD4; margin-top: 0;">📅 Trip Details</h3>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${trip.date.toDate().toLocaleDateString()}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${trip.date.toDate().toLocaleTimeString()}</p>
                <p style="margin: 8px 0;"><strong>Your Seat:</strong> <span style="background-color: #00BCD4; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">#${registration.seatNumber}</span></p>
              </div>

              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00BCD4; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>📎 Important:</strong> Your signed waiver is attached to this email for your records. Please keep it for reference.</p>
              </div>

              <p style="font-size: 16px; margin-top: 30px;">We look forward to seeing you on the trip! If you have any questions, feel free to reach out.</p>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Best regards,<br><strong>IVRI Tours Team</strong></p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: 'trip-waiver.pdf',
            content: pdfBuffer
          }
        ]
      });

      // Send notification to admin
      await transporter.sendMail({
        from: '"IVRI Tours" <noreply@ivritours.com>',
        to: ADMIN_EMAIL,
        subject: `🎫 New Registration: ${trip.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00BCD4;">🎫 New Registration Received</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Trip Details</h3>
              <p><strong>Trip:</strong> ${trip.title}</p>
              <p><strong>Date:</strong> ${trip.date.toDate().toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${trip.date.toDate().toLocaleTimeString()}</p>
            </div>
            <div style="background-color: #E0F7FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Participant Information</h3>
              <p><strong>Name:</strong> ${registration.firstName} ${registration.lastName}</p>
              <p><strong>Email:</strong> <a href="mailto:${registration.email}">${registration.email}</a></p>
              <p><strong>Phone:</strong> <a href="tel:${registration.phone}">${registration.phone}</a></p>
              <p><strong>Seat Number:</strong> #${registration.seatNumber}</p>
              <p><strong>Payment Method:</strong> ${registration.paymentMethod === 'card' ? 'Card Payment' : 'Pay on Trip'}</p>
              <p><strong>Payment Status:</strong> ${registration.paid ? '✅ Paid' : '❌ Not Paid'}</p>
              <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${pdfUrl}" style="background-color: #00BCD4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Signed Waiver PDF</a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated notification from IVRI Tours Trip Management System</p>
          </div>
        `
      });

      console.log('Successfully processed registration:', registrationId);
      return null;

    } catch (error) {
      console.error('Error processing registration:', error);
      throw error;
    }
  });

/**
 * Cloud Function triggered when a new user is created (Admin sign up)
 * Sends welcome email to the new admin user
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const email = user.email;
    const displayName = user.displayName || email.split('@')[0];

    // Send welcome email to new admin
    await transporter.sendMail({
      from: '"IVRI Tours" <noreply@ivritours.com>',
      to: email,
      subject: '🎉 Welcome to IVRI Tours Admin Portal!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to IVRI Tours!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Hello ${displayName},</p>
            <p style="font-size: 16px;">Welcome to the <strong style="color: #00BCD4;">IVRI Tours Trip Management System</strong>!</p>

            <div style="background-color: #E0F7FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #00BCD4; margin-top: 0;">🚀 Getting Started</h3>
              <p style="margin: 8px 0;">Your admin account has been successfully created. You can now:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Create and manage trips</li>
                <li style="margin: 8px 0;">View and manage participant registrations</li>
                <li style="margin: 8px 0;">Track payments and seat assignments</li>
                <li style="margin: 8px 0;">Generate reports and communications</li>
              </ul>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00BCD4; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>📧 Your Admin Email:</strong> ${email}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://planyourtrip-ed010.web.app" style="background-color: #00BCD4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">Access Admin Dashboard</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Best regards,<br><strong>IVRI Tours Team</strong></p>
            </div>
          </div>
        </div>
      `
    });

    // Notify main admin about new user creation
    await transporter.sendMail({
      from: '"IVRI Tours" <noreply@ivritours.com>',
      to: ADMIN_EMAIL,
      subject: '👤 New Admin User Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00BCD4;">👤 New Admin User Created</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Display Name:</strong> ${displayName}</p>
            <p><strong>User ID:</strong> ${user.uid}</p>
            <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">This is an automated notification from IVRI Tours Trip Management System</p>
        </div>
      `
    });

    console.log('Welcome email sent to new user:', email);
    return null;

  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - we don't want to fail user creation if email fails
    return null;
  }
});

/**
 * Callable function to resend confirmation email
 */
exports.resendConfirmationEmail = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to resend emails'
    );
  }

  const { registrationId } = data;

  try {
    const regDoc = await admin.firestore().collection('registrations').doc(registrationId).get();

    if (!regDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Registration not found');
    }

    const registration = regDoc.data();
    const tripDoc = await admin.firestore().collection('trips').doc(registration.tripId).get();
    const trip = tripDoc.data();

    // Fetch PDF from storage
    const bucket = admin.storage().bucket();
    const pdfFileName = `waivers/${registration.tripId}/${registrationId}.pdf`;
    const file = bucket.file(pdfFileName);
    const [pdfBuffer] = await file.download();

    // Resend email
    await transporter.sendMail({
      from: '"Trip Management System" <noreply@tripsystem.com>',
      to: registration.email,
      subject: `Registration Confirmation (Resent): ${trip.title}`,
      html: `
        <h2>Registration Confirmation</h2>
        <p>Dear ${registration.firstName} ${registration.lastName},</p>
        <p>As requested, here is your registration confirmation for <strong>${trip.title}</strong>.</p>
        <p><strong>Trip Date:</strong> ${trip.date.toDate().toLocaleDateString()}</p>
        <p><strong>Your Seat:</strong> #${registration.seatNumber}</p>
        <p>Your signed waiver is attached to this email.</p>
      `,
      attachments: [
        {
          filename: 'waiver.pdf',
          content: pdfBuffer
        }
      ]
    });

    return { success: true };

  } catch (error) {
    console.error('Error resending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to resend email');
  }
});

// ==========================================
// WHATSAPP BOT FUNCTIONS
// ==========================================

const MessagingResponse = require('twilio').twiml.MessagingResponse;

/**
 * Detect language from message (simple detection)
 */
function detectLanguage(message) {
  const russianChars = /[а-яА-ЯёЁ]/;
  return russianChars.test(message) ? 'ru' : 'en';
}

/**
 * WhatsApp Bot - Main webhook handler
 * This function receives messages from WhatsApp via Twilio and responds with appropriate information
 */
exports.whatsappBot = functions.https.onRequest(async (req, res) => {
  try {
    const incomingMessage = req.body.Body?.trim() || '';
    const incomingLower = incomingMessage.toLowerCase();
    const fromNumber = req.body.From || '';
    const language = detectLanguage(incomingMessage);

    console.log('Received WhatsApp message:', { from: fromNumber, message: incomingMessage, language });

    const twiml = new MessagingResponse();
    let responseMessage = '';

    // Command routing (support both English and Russian)
    if (incomingLower.includes('help') || incomingLower.includes('помощь') ||
        incomingLower === 'hi' || incomingLower === 'hello' ||
        incomingLower === 'привет' || incomingLower === 'здравствуйте') {
      responseMessage = await handleHelpCommand(language);
    } else if (incomingLower.includes('summary') || incomingLower.includes('pickup') ||
               incomingLower.includes('сводка') || incomingLower.includes('места сбора')) {
      responseMessage = await handleSummaryCommand(incomingMessage, language);
    } else if (incomingLower.includes('book') || incomingLower.includes('register') ||
               incomingLower.includes('забронировать') || incomingLower.includes('регистрация')) {
      responseMessage = await handleBookCommand(incomingMessage, language);
    } else if (incomingLower.includes('trips') || incomingLower.includes('list') ||
               incomingLower.includes('поездки') || incomingLower.includes('туры') ||
               incomingLower.includes('список')) {
      responseMessage = await handleListTripsCommand(language);
    } else if (incomingLower.includes('who') || incomingLower.includes('participants') ||
               incomingLower.includes('registered') || incomingLower.includes('кто') ||
               incomingLower.includes('участники') || incomingLower.includes('зарегистрированы')) {
      responseMessage = await handleWhoIsGoingCommand(incomingMessage, language);
    } else if (incomingLower.includes('gift') || incomingLower.includes('card') ||
               incomingLower.includes('подарочная') || incomingLower.includes('карта')) {
      responseMessage = await handleGiftCardCommand(incomingMessage, language);
    } else if (incomingLower.includes('cancel') || incomingLower.includes('отменить')) {
      responseMessage = await handleCancelCommand(incomingMessage, language);
    } else if (incomingLower.includes('info') || incomingLower.includes('details') ||
               incomingLower.includes('информация') || incomingLower.includes('детали')) {
      responseMessage = await handleTripDetailsCommand(incomingMessage, language);
    } else if (incomingLower.includes('stats') || incomingLower.includes('статистика')) {
      responseMessage = await handleStatsCommand(language);
    } else {
      responseMessage = await handleUnknownCommand(language);
    }

    twiml.message(responseMessage);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (error) {
    console.error('WhatsApp bot error:', error);
    const twiml = new MessagingResponse();
    const errorMsg = detectLanguage(req.body.Body || '') === 'ru'
      ? 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.'
      : 'Sorry, I encountered an error processing your request. Please try again later.';
    twiml.message(errorMsg);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

/**
 * Help command - Shows available commands
 */
async function handleHelpCommand(language = 'en') {
  if (language === 'ru') {
    return `🤖 *IVRI Tours WhatsApp Ассистент*\n\n` +
      `Вот чем я могу помочь:\n\n` +
      `📋 *ПОЕЗДКИ* - Просмотр предстоящих туров\n` +
      `👥 *КТО [название]* - Кто зарегистрирован на поездку\n` +
      `📍 *СВОДКА* - Сводка поездки с местами сбора\n` +
      `🎫 *ЗАБРОНИРОВАТЬ* - Забронировать тур\n` +
      `🎁 *КАРТА [код]* - Проверить подарочную карту\n` +
      `ℹ️ *ИНФО [название]* - Детали о поездке\n` +
      `📊 *СТАТИСТИКА* - Общая статистика по турам\n` +
      `❌ *ОТМЕНИТЬ* - Отменить регистрацию\n` +
      `❓ *ПОМОЩЬ* - Показать это сообщение\n\n` +
      `Пример: "сводка" или "кто едет в Масаду?"`;
  }

  return `🤖 *IVRI Tours WhatsApp Assistant*\n\n` +
    `Here's what I can help you with:\n\n` +
    `📋 *TRIPS* - View upcoming trips\n` +
    `👥 *WHO [trip name]* - See who's registered for a trip\n` +
    `📍 *SUMMARY* - Trip summary with pickup locations\n` +
    `🎫 *BOOK* - Book someone for a trip\n` +
    `🎁 *GIFT [code]* - Check gift card balance\n` +
    `ℹ️ *INFO [trip name]* - Get detailed trip information\n` +
    `📊 *STATS* - Get overall tour statistics\n` +
    `❌ *CANCEL* - Cancel a registration\n` +
    `❓ *HELP* - Show this message\n\n` +
    `Example: "summary" or "who is going to Masada?"`;
}

/**
 * Unknown command handler
 */
async function handleUnknownCommand(language = 'en') {
  if (language === 'ru') {
    return `Я не понял эту команду. Напишите *ПОМОЩЬ* чтобы увидеть что я могу!`;
  }
  return `I didn't understand that command. Type *HELP* to see what I can do!`;
}

/**
 * List all upcoming trips
 */
async function handleListTripsCommand(language = 'en') {
  try {
    const now = new Date();
    const tripsSnapshot = await admin.firestore()
      .collection('trips')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(now))
      .orderBy('date', 'asc')
      .limit(10)
      .get();

    if (tripsSnapshot.empty) {
      return language === 'ru'
        ? '📅 На данный момент нет запланированных поездок.'
        : '📅 No upcoming trips scheduled at the moment.';
    }

    let response = language === 'ru'
      ? '🗓️ *Предстоящие поездки:*\n\n'
      : '🗓️ *Upcoming Trips:*\n\n';

    tripsSnapshot.forEach((doc) => {
      const trip = doc.data();
      const tripDate = trip.date.toDate();
      const availableSeats = trip.totalSeats - (trip.occupiedSeats || 0);
      const pricePerPerson = trip.pricePerPerson || trip.price;

      response += `📍 *${trip.title}*\n`;
      if (language === 'ru') {
        response += `   Дата: ${tripDate.toLocaleDateString('ru-RU')}\n`;
        response += `   Цена за человека: ₪${pricePerPerson}\n`;
        if (trip.price && trip.price !== pricePerPerson) {
          response += `   Общая цена: ₪${trip.price}\n`;
        }
        response += `   Доступно: ${availableSeats}/${trip.totalSeats} мест\n`;
        if (trip.description) {
          response += `   📝 ${trip.description}\n`;
        }
      } else {
        response += `   Date: ${tripDate.toLocaleDateString()}\n`;
        response += `   Price per person: ₪${pricePerPerson}\n`;
        if (trip.price && trip.price !== pricePerPerson) {
          response += `   Total price: ₪${trip.price}\n`;
        }
        response += `   Available: ${availableSeats}/${trip.totalSeats} seats\n`;
        if (trip.description) {
          response += `   📝 ${trip.description}\n`;
        }
      }
      response += '\n';
    });

    return response;
  } catch (error) {
    console.error('Error listing trips:', error);
    return language === 'ru'
      ? 'Извините, не удалось получить список поездок. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t retrieve the trips list. Please try again.';
  }
}

/**
 * Check who is registered for a specific trip
 */
async function handleWhoIsGoingCommand(message, language = 'en') {
  try {
    const tripsSnapshot = await admin.firestore()
      .collection('trips')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date()))
      .orderBy('date', 'asc')
      .limit(5)
      .get();

    if (tripsSnapshot.empty) {
      return language === 'ru'
        ? '📅 Предстоящие поездки не найдены.'
        : '📅 No upcoming trips found.';
    }

    // For simplicity, show the nearest one
    const tripDoc = tripsSnapshot.docs[0];
    const trip = tripDoc.data();
    const tripId = tripDoc.id;

    // Get registrations for this trip
    const registrationsSnapshot = await admin.firestore()
      .collection('registrations')
      .where('tripId', '==', tripId)
      .get();

    if (registrationsSnapshot.empty) {
      if (language === 'ru') {
        return `📍 *${trip.title}*\n` +
          `Дата: ${trip.date.toDate().toLocaleDateString('ru-RU')}\n\n` +
          `Пока нет регистраций.`;
      }
      return `📍 *${trip.title}*\n` +
        `Date: ${trip.date.toDate().toLocaleDateString()}\n\n` +
        `No registrations yet.`;
    }

    let paidCount = 0;
    let unpaidCount = 0;
    registrationsSnapshot.forEach(doc => {
      if (doc.data().paid) paidCount++;
      else unpaidCount++;
    });

    let response = `📍 *${trip.title}*\n`;
    if (language === 'ru') {
      response += `Дата: ${trip.date.toDate().toLocaleDateString('ru-RU')}\n`;
      response += `Зарегистрировано: ${registrationsSnapshot.size} человек\n`;
      response += `✅ Оплачено: ${paidCount} | ⏳ Не оплачено: ${unpaidCount}\n\n`;
      response += `👥 *Участники:*\n`;
    } else {
      response += `Date: ${trip.date.toDate().toLocaleDateString()}\n`;
      response += `Registered: ${registrationsSnapshot.size} people\n`;
      response += `✅ Paid: ${paidCount} | ⏳ Unpaid: ${unpaidCount}\n\n`;
      response += `👥 *Participants:*\n`;
    }

    registrationsSnapshot.forEach((doc) => {
      const reg = doc.data();
      const paidStatus = reg.paid ? '✅' : '⏳';
      response += `${paidStatus} ${reg.firstName} ${reg.lastName} - ${language === 'ru' ? 'Место' : 'Seat'} #${reg.seatNumber}\n`;
    });

    return response;
  } catch (error) {
    console.error('Error getting participants:', error);
    return language === 'ru'
      ? 'Извините, не удалось получить список участников. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t retrieve the participants list. Please try again.';
  }
}

/**
 * Book someone for a trip
 */
async function handleBookCommand(message, language = 'en') {
  if (language === 'ru') {
    return `🎫 *Функция бронирования*\n\n` +
      `Для бронирования тура, пожалуйста, используйте веб-панель:\n` +
      `https://planyourtrip-ed010.web.app\n\n` +
      `Это гарантирует правильное оформление всех деталей:\n` +
      `• Полная контактная информация\n` +
      `• Выбор места\n` +
      `• Детали оплаты\n` +
      `• Подпись соглашения\n\n` +
      `Вы можете просматривать списки участников в любое время!`;
  }

  return `🎫 *Booking Feature*\n\n` +
    `To book someone for a trip, please use the web dashboard:\n` +
    `https://planyourtrip-ed010.web.app\n\n` +
    `This ensures all details are captured correctly including:\n` +
    `• Full contact information\n` +
    `• Seat selection\n` +
    `• Payment details\n` +
    `• Waiver signature\n\n` +
    `You can view participant lists here anytime!`;
}

/**
 * Check gift card balance
 */
async function handleGiftCardCommand(message, language = 'en') {
  try {
    const codeMatch = message.match(/[A-Z0-9]{6,}/i);

    if (!codeMatch) {
      if (language === 'ru') {
        return `🎁 *Поиск подарочной карты*\n\n` +
          `Пожалуйста, укажите код подарочной карты.\n` +
          `Пример: "карта ABC123"`;
      }
      return `🎁 *Gift Card Lookup*\n\n` +
        `Please provide the gift card code.\n` +
        `Example: "gift card ABC123"`;
    }

    const code = codeMatch[0].toUpperCase();
    const giftCardsSnapshot = await admin.firestore()
      .collection('giftCards')
      .where('code', '==', code)
      .limit(1)
      .get();

    if (giftCardsSnapshot.empty) {
      return language === 'ru'
        ? `❌ Подарочная карта "${code}" не найдена.`
        : `❌ Gift card code "${code}" not found.`;
    }

    const giftCard = giftCardsSnapshot.docs[0].data();
    const remainingBalance = giftCard.remainingBalance !== undefined
      ? giftCard.remainingBalance
      : giftCard.amount;
    const expiryDate = giftCard.expiryDate.toDate();
    const isExpired = expiryDate < new Date();
    const isFullyUsed = remainingBalance === 0;

    let response = language === 'ru'
      ? `🎁 *Подарочная карта: ${code}*\n\n`
      : `🎁 *Gift Card: ${code}*\n\n`;

    if (language === 'ru') {
      response += `Первоначальная сумма: ₪${giftCard.amount}\n`;
      response += `Остаток: ₪${remainingBalance}\n`;
      response += `Срок действия: ${expiryDate.toLocaleDateString('ru-RU')}\n`;

      if (isExpired) {
        response += `\n❌ *Статус: ПРОСРОЧЕНА*`;
      } else if (isFullyUsed) {
        response += `\n✅ *Статус: ИСПОЛЬЗОВАНА*`;
      } else if (giftCard.usageHistory && giftCard.usageHistory.length > 0) {
        response += `\n⚠️ *Статус: ЧАСТИЧНО ИСПОЛЬЗОВАНА*`;
      } else if (giftCard.viewed) {
        response += `\n👀 *Статус: ПРОСМОТРЕНА*`;
      } else {
        response += `\n✅ *Статус: АКТИВНА*`;
      }

      if (giftCard.usageHistory && giftCard.usageHistory.length > 0) {
        response += `\n\n📋 *История использования:*\n`;
        giftCard.usageHistory.forEach((usage, index) => {
          response += `${index + 1}. ₪${usage.amountUsed} - ${usage.tripName} (${usage.date.toDate().toLocaleDateString('ru-RU')})\n`;
        });
      }
    } else {
      response += `Original Amount: ₪${giftCard.amount}\n`;
      response += `Remaining Balance: ₪${remainingBalance}\n`;
      response += `Expires: ${expiryDate.toLocaleDateString()}\n`;

      if (isExpired) {
        response += `\n❌ *Status: EXPIRED*`;
      } else if (isFullyUsed) {
        response += `\n✅ *Status: FULLY USED*`;
      } else if (giftCard.usageHistory && giftCard.usageHistory.length > 0) {
        response += `\n⚠️ *Status: PARTIALLY USED*`;
      } else if (giftCard.viewed) {
        response += `\n👀 *Status: VIEWED*`;
      } else {
        response += `\n✅ *Status: ACTIVE*`;
      }

      if (giftCard.usageHistory && giftCard.usageHistory.length > 0) {
        response += `\n\n📋 *Usage History:*\n`;
        giftCard.usageHistory.forEach((usage, index) => {
          response += `${index + 1}. ₪${usage.amountUsed} - ${usage.tripName} (${usage.date.toDate().toLocaleDateString()})\n`;
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error checking gift card:', error);
    return language === 'ru'
      ? 'Извините, не удалось проверить подарочную карту. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t check the gift card. Please try again.';
  }
}

/**
 * Cancel a registration
 */
async function handleCancelCommand(message, language = 'en') {
  if (language === 'ru') {
    return `❌ *Отмена регистрации*\n\n` +
      `Для отмены регистрации, пожалуйста, используйте веб-панель:\n` +
      `https://planyourtrip-ed010.web.app\n\n` +
      `Это гарантирует правильную обработку возврата согласно нашей политике отмены.`;
  }

  return `❌ *Cancellation*\n\n` +
    `To cancel a registration, please use the web dashboard:\n` +
    `https://planyourtrip-ed010.web.app\n\n` +
    `This ensures proper refund processing according to our cancellation policy.`;
}

/**
 * Get detailed trip information
 */
async function handleTripDetailsCommand(message, language = 'en') {
  try {
    const tripsSnapshot = await admin.firestore()
      .collection('trips')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date()))
      .orderBy('date', 'asc')
      .limit(1)
      .get();

    if (tripsSnapshot.empty) {
      return language === 'ru'
        ? '📅 Предстоящие поездки не найдены.'
        : '📅 No upcoming trips found.';
    }

    const trip = tripsSnapshot.docs[0].data();
    const tripId = tripsSnapshot.docs[0].id;
    const tripDate = trip.date.toDate();
    const availableSeats = trip.totalSeats - (trip.occupiedSeats || 0);
    const pricePerPerson = trip.pricePerPerson || trip.price;

    // Get registrations
    const registrationsSnapshot = await admin.firestore()
      .collection('registrations')
      .where('tripId', '==', tripId)
      .get();

    let paidCount = 0;
    let totalRevenue = 0;
    registrationsSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.paid) {
        paidCount++;
        totalRevenue += pricePerPerson;
      }
    });

    let response = language === 'ru' ? 'ℹ️ *Детали поездки*\n\n' : 'ℹ️ *Trip Details*\n\n';
    response += `📍 *${trip.title}*\n\n`;

    if (language === 'ru') {
      response += `📅 *Дата:* ${tripDate.toLocaleDateString('ru-RU')} в ${tripDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n`;
      response += `💰 *Цена за человека:* ₪${pricePerPerson}\n`;
      if (trip.price && trip.price !== pricePerPerson) {
        response += `💰 *Общая цена:* ₪${trip.price}\n`;
      }
      response += `🚌 *Всего мест:* ${trip.totalSeats}\n`;
      response += `✅ *Доступно мест:* ${availableSeats}\n`;
      response += `👥 *Зарегистрировано:* ${registrationsSnapshot.size}\n`;
      response += `💳 *Оплачено:* ${paidCount}\n`;
      response += `💵 *Общий доход:* ₪${totalRevenue}\n`;

      if (trip.description) {
        response += `\n📝 *Описание:*\n${trip.description}\n`;
      }

      if (trip.meetingPoint) {
        response += `\n📍 *Место встречи:* ${trip.meetingPoint}\n`;
      }
    } else {
      response += `📅 *Date:* ${tripDate.toLocaleDateString()} at ${tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
      response += `💰 *Price per person:* ₪${pricePerPerson}\n`;
      if (trip.price && trip.price !== pricePerPerson) {
        response += `💰 *Total price:* ₪${trip.price}\n`;
      }
      response += `🚌 *Total seats:* ${trip.totalSeats}\n`;
      response += `✅ *Available seats:* ${availableSeats}\n`;
      response += `👥 *Registered:* ${registrationsSnapshot.size}\n`;
      response += `💳 *Paid:* ${paidCount}\n`;
      response += `💵 *Total revenue:* ₪${totalRevenue}\n`;

      if (trip.description) {
        response += `\n📝 *Description:*\n${trip.description}\n`;
      }

      if (trip.meetingPoint) {
        response += `\n📍 *Meeting point:* ${trip.meetingPoint}\n`;
      }
    }

    return response;
  } catch (error) {
    console.error('Error getting trip details:', error);
    return language === 'ru'
      ? 'Извините, не удалось получить детали поездки. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t retrieve trip details. Please try again.';
  }
}

/**
 * Get overall statistics
 */
async function handleStatsCommand(language = 'en') {
  try {
    const now = new Date();

    // Get upcoming trips
    const upcomingTripsSnapshot = await admin.firestore()
      .collection('trips')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(now))
      .get();

    // Get all registrations
    const registrationsSnapshot = await admin.firestore()
      .collection('registrations')
      .get();

    // Get gift cards
    const giftCardsSnapshot = await admin.firestore()
      .collection('giftCards')
      .get();

    let totalRevenue = 0;
    let paidRegistrations = 0;
    let unpaidRegistrations = 0;

    registrationsSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.paid) {
        paidRegistrations++;
        // Estimate revenue - you might want to store actual amounts
        totalRevenue += 100; // placeholder
      } else {
        unpaidRegistrations++;
      }
    });

    let activeGiftCards = 0;
    let giftCardTotalValue = 0;

    giftCardsSnapshot.forEach(doc => {
      const card = doc.data();
      const balance = card.remainingBalance !== undefined ? card.remainingBalance : card.amount;
      const isExpired = card.expiryDate.toDate() < now;

      if (balance > 0 && !isExpired) {
        activeGiftCards++;
        giftCardTotalValue += balance;
      }
    });

    let response = language === 'ru' ? '📊 *Общая статистика*\n\n' : '📊 *Overall Statistics*\n\n';

    if (language === 'ru') {
      response += `🗓️ *Предстоящие поездки:* ${upcomingTripsSnapshot.size}\n`;
      response += `👥 *Всего регистраций:* ${registrationsSnapshot.size}\n`;
      response += `✅ *Оплаченные:* ${paidRegistrations}\n`;
      response += `⏳ *Неоплаченные:* ${unpaidRegistrations}\n`;
      response += `💰 *Ориентировочный доход:* ₪${totalRevenue}\n`;
      response += `🎁 *Активные подарочные карты:* ${activeGiftCards}\n`;
      response += `💳 *Общая стоимость карт:* ₪${giftCardTotalValue}\n`;
    } else {
      response += `🗓️ *Upcoming trips:* ${upcomingTripsSnapshot.size}\n`;
      response += `👥 *Total registrations:* ${registrationsSnapshot.size}\n`;
      response += `✅ *Paid:* ${paidRegistrations}\n`;
      response += `⏳ *Unpaid:* ${unpaidRegistrations}\n`;
      response += `💰 *Estimated revenue:* ₪${totalRevenue}\n`;
      response += `🎁 *Active gift cards:* ${activeGiftCards}\n`;
      response += `💳 *Total card value:* ₪${giftCardTotalValue}\n`;
    }

    return response;
  } catch (error) {
    console.error('Error getting stats:', error);
    return language === 'ru'
      ? 'Извините, не удалось получить статистику. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t retrieve statistics. Please try again.';
  }
}

/**
 * Get trip summary with pickup places
 */
async function handleSummaryCommand(message, language = 'en') {
  try {
    const tripsSnapshot = await admin.firestore()
      .collection('trips')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date()))
      .orderBy('date', 'asc')
      .limit(1)
      .get();

    if (tripsSnapshot.empty) {
      return language === 'ru'
        ? '📅 Предстоящие поездки не найдены.'
        : '📅 No upcoming trips found.';
    }

    const trip = tripsSnapshot.docs[0].data();
    const tripId = tripsSnapshot.docs[0].id;
    const tripDate = trip.date.toDate();
    const pricePerPerson = trip.pricePerPerson || trip.price;

    // Get registrations for this trip
    const registrationsSnapshot = await admin.firestore()
      .collection('registrations')
      .where('tripId', '==', tripId)
      .get();

    if (registrationsSnapshot.empty) {
      if (language === 'ru') {
        return `📍 *${trip.title}*\n` +
          `Дата: ${tripDate.toLocaleDateString('ru-RU')}\n\n` +
          `Пока нет регистраций.`;
      }
      return `📍 *${trip.title}*\n` +
        `Date: ${tripDate.toLocaleDateString()}\n\n` +
        `No registrations yet.`;
    }

    // Count paid/unpaid
    let paidCount = 0;
    let unpaidCount = 0;
    registrationsSnapshot.forEach(doc => {
      if (doc.data().paid) paidCount++;
      else unpaidCount++;
    });

    // Build response
    let response = language === 'ru'
      ? '📋 *СВОДКА ПОЕЗДКИ*\n\n'
      : '📋 *TRIP SUMMARY*\n\n';

    response += `📍 *${trip.title}*\n`;

    if (language === 'ru') {
      response += `📅 *Дата:* ${tripDate.toLocaleDateString('ru-RU')} в ${tripDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n`;
      if (trip.driverName) {
        response += `🚗 *Водитель:* ${trip.driverName}\n`;
      }
      if (trip.pickupPlace) {
        response += `📍 *Место сбора:* ${trip.pickupPlace}\n`;
      }
      response += `💰 *Цена за человека:* ₪${pricePerPerson}\n`;
      response += `👥 *Зарегистрировано:* ${registrationsSnapshot.size} человек\n`;
      response += `✅ *Оплачено:* ${paidCount} | ⏳ *Не оплачено:* ${unpaidCount}\n`;
      response += `💵 *Доход:* ₪${paidCount * pricePerPerson}\n\n`;

      response += `👥 *УЧАСТНИКИ И МЕСТА СБОРА:*\n\n`;
    } else {
      response += `📅 *Date:* ${tripDate.toLocaleDateString()} at ${tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
      if (trip.driverName) {
        response += `🚗 *Driver:* ${trip.driverName}\n`;
      }
      if (trip.pickupPlace) {
        response += `📍 *Meeting Point:* ${trip.pickupPlace}\n`;
      }
      response += `💰 *Price per person:* ₪${pricePerPerson}\n`;
      response += `👥 *Registered:* ${registrationsSnapshot.size} people\n`;
      response += `✅ *Paid:* ${paidCount} | ⏳ *Unpaid:* ${unpaidCount}\n`;
      response += `💵 *Revenue:* ₪${paidCount * pricePerPerson}\n\n`;

      response += `👥 *PARTICIPANTS & PICKUP LOCATIONS:*\n\n`;
    }

    // Group by pickup place
    const pickupGroups = {};
    registrationsSnapshot.forEach((doc) => {
      const reg = doc.data();
      const pickupPlace = reg.preferredPickupPlace || (language === 'ru' ? 'Не указано' : 'Not specified');

      if (!pickupGroups[pickupPlace]) {
        pickupGroups[pickupPlace] = [];
      }

      pickupGroups[pickupPlace].push({
        name: `${reg.firstName} ${reg.lastName}`,
        seat: reg.seatNumber,
        phone: reg.phone,
        paid: reg.paid
      });
    });

    // Sort pickup places (undefined/not specified last)
    const sortedPickupPlaces = Object.keys(pickupGroups).sort((a, b) => {
      const aIsUnspecified = a === 'Not specified' || a === 'Не указано';
      const bIsUnspecified = b === 'Not specified' || b === 'Не указано';
      if (aIsUnspecified && !bIsUnspecified) return 1;
      if (!aIsUnspecified && bIsUnspecified) return -1;
      return a.localeCompare(b);
    });

    // Output grouped by pickup location
    sortedPickupPlaces.forEach(pickupPlace => {
      const participants = pickupGroups[pickupPlace];
      response += `📍 *${pickupPlace}* (${participants.length})\n`;

      participants.forEach(p => {
        const paidStatus = p.paid ? '✅' : '⏳';
        const seatText = language === 'ru' ? 'Место' : 'Seat';
        response += `  ${paidStatus} ${p.name} - ${seatText} #${p.seat}`;
        if (p.phone) {
          response += ` | 📞 ${p.phone}`;
        }
        response += '\n';
      });
      response += '\n';
    });

    // Add footer
    if (language === 'ru') {
      response += `\n━━━━━━━━━━━━━━━━━━\n`;
      response += `💡 *Всего ${registrationsSnapshot.size} участников из ${sortedPickupPlaces.length} ${sortedPickupPlaces.length === 1 ? 'места' : 'мест'} сбора*`;
    } else {
      response += `\n━━━━━━━━━━━━━━━━━━\n`;
      response += `💡 *Total ${registrationsSnapshot.size} participants from ${sortedPickupPlaces.length} pickup ${sortedPickupPlaces.length === 1 ? 'location' : 'locations'}*`;
    }

    return response;
  } catch (error) {
    console.error('Error getting trip summary:', error);
    return language === 'ru'
      ? 'Извините, не удалось получить сводку поездки. Пожалуйста, попробуйте снова.'
      : 'Sorry, I couldn\'t retrieve trip summary. Please try again.';
  }
}

/**
 * Sends contact form email to admin
 */
exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  const { name, email, phone, destination, message, toEmail } = data;

  if (!name || !email || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const mailOptions = {
    from: `IVRI Tours Contact Form <${functions.config().email?.user || 'your-email@gmail.com'}>`,
    to: toEmail || 'pupko@mail.com',
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">IVRI Tours - New Contact Request</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; border-bottom: 2px solid #00BCD4; padding-bottom: 10px;">Contact Information</h2>

          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555; width: 150px;">Name:</td>
              <td style="padding: 10px; color: #333;">${name}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 10px; color: #333;"><a href="mailto:${email}" style="color: #00BCD4;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 10px; color: #333;">${phone || 'Not provided'}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; font-weight: bold; color: #555;">Destination:</td>
              <td style="padding: 10px; color: #333;">${destination || 'Not specified'}</td>
            </tr>
          </table>

          <h3 style="color: #333; border-bottom: 2px solid #00BCD4; padding-bottom: 10px; margin-top: 30px;">Message</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-left: 4px solid #00BCD4; border-radius: 4px;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              <strong>Quick Reply:</strong> Click the email address above to respond directly to ${name}
            </p>
          </div>
        </div>

        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            This email was sent from the IVRI Tours contact form<br>
            Received on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully to:', toEmail);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
