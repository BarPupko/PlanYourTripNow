const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

admin.initializeApp();

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
        from: '"Trip Management System" <noreply@tripsystem.com>',
        to: registration.email,
        subject: `Registration Confirmed: ${trip.title}`,
        html: `
          <h2>Registration Confirmed!</h2>
          <p>Dear ${registration.firstName} ${registration.lastName},</p>
          <p>Thank you for registering for <strong>${trip.title}</strong>.</p>
          <p><strong>Trip Date:</strong> ${trip.date.toDate().toLocaleDateString()}</p>
          <p><strong>Your Seat:</strong> #${registration.seatNumber}</p>
          <p>Your signed waiver is attached to this email for your records.</p>
          <p>We look forward to seeing you on the trip!</p>
          <br>
          <p>Best regards,<br>Trip Management Team</p>
        `,
        attachments: [
          {
            filename: 'waiver.pdf',
            content: pdfBuffer
          }
        ]
      });

      // Send notification to admin
      // Note: You'll need to configure the admin email
      const adminEmail = functions.config().admin?.email || 'admin@example.com';

      await transporter.sendMail({
        from: '"Trip Management System" <noreply@tripsystem.com>',
        to: adminEmail,
        subject: `New Registration: ${trip.title}`,
        html: `
          <h2>New Registration Received</h2>
          <p><strong>Trip:</strong> ${trip.title}</p>
          <p><strong>Date:</strong> ${trip.date.toDate().toLocaleDateString()}</p>
          <p><strong>Participant:</strong> ${registration.firstName} ${registration.lastName}</p>
          <p><strong>Email:</strong> ${registration.email}</p>
          <p><strong>Phone:</strong> ${registration.phone}</p>
          <p><strong>Seat:</strong> #${registration.seatNumber}</p>
          <p><strong>Registration Time:</strong> ${registration.timestamp.toDate().toLocaleString()}</p>
          <br>
          <p><a href="${pdfUrl}">View Waiver PDF</a></p>
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
