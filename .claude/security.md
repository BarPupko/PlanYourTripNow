Security Audit — IVRI Tours
Overall Rating: Moderate-High Risk — Several critical vulnerabilities need attention
CRITICAL Issues (Fix First)
#	Issue	Location	Attack
1	Any authenticated user = admin	firestore.rules:8 + PrivateRoute.jsx	Someone creates an account → has full admin write access to trips
2	Anyone can spam registrations	firestore.rules:14 (allow create: if true)	Bot floods registrations → generates 1000 emails + PDFs → costs money
3	All PII is publicly readable	firestore.rules:17 (allow read: if true)	Anyone calls Firestore API → downloads every participant's name, email, phone
4	No rate limiting on Cloud Functions	functions/index.js	Bot creates 1000 registrations → triggers 1000 PDF generations + admin emails
5	Email header injection	functions/index.js:1814	Contact form email field with attacker@x.com\nBcc: spam@list.com → sends to unintended people
6	HTML injection in emails	functions/index.js:1846	Contact form message: "<script>...</script>" executes in email client
7	Gift card balance manipulation	firestore.rules:45	hasOnly() check is insufficient — balance field can be altered
8	No login brute-force protection	Login.jsx	Bot tries 10,000 passwords on admin account — no lockout, no CAPTCHA
HIGH Issues
#	Issue	Location
9	All waivers (with signatures + PII) are publicly readable in Storage	storage.rules:12
10	Anyone can upload any file as a "signature" (no size/type limit)	storage.rules:5-6
11	No CAPTCHA on the registration form — bots can fill it freely	RegistrationForm.jsx
12	Race condition in seat assignment — two people can get the same seat	RegistrationForm.jsx:156-169
13	Gift cards fully readable by anyone (IDs, balances, codes)	firestore.rules:35
14	sendContactEmail Cloud Function has no auth check — anyone calls it	functions/index.js:1804
The 3 Most Important Fixes
Fix 1 — Firestore Rules (most impactful, 30 min to fix)
The current rules let anyone read all registrations/trips and any logged-in user act as admin. Replace firestore.rules with:


// trips: public read is OK, but only admin can write
allow read: if true;
allow write: if request.auth.token.admin == true;

// registrations: only owner can create/read their own
allow create: if request.auth != null;
allow read: if request.auth != null && (request.auth.token.admin == true || resource.data.userId == request.auth.uid);

// gift cards: only admin reads/writes
allow read, write: if request.auth.token.admin == true;
Then set the admin custom claim in Firebase Console → your admin account → Custom Claims: {"admin": true}

Fix 2 — Sanitize email inputs in Cloud Functions (prevents header injection + XSS)
In functions/index.js around line 1830, wrap user inputs:


// Add this helper at the top
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Strip newlines from email/name fields used in headers
const safeEmail = email.replace(/[\r\n]/g, '');
const safeName = escapeHtml(name);
const safeMessage = escapeHtml(message);
Fix 3 — Add rate limiting to stop bot abuse
Firebase doesn't have built-in rate limiting for Firestore writes or HTTPS functions. The quickest options:

reCAPTCHA v3 on the registration form (invisible, no friction for real users)
Firebase App Check — restricts Firestore/Functions access to your actual app only (blocks direct API abuse)
App Check is the single highest-leverage thing you can enable — go to Firebase Console → App Check → Enforce for Firestore and Cloud Functions.

Medium Issues (not urgent but should be fixed)
No duplicate registration prevention (same person registers 5 times)
Admin email hardcoded in client-side code (RegistrationForm.jsx:213)
console.error(err) in Login leaks error details to DevTools
Contact form has no submission rate limit (inbox spam)
No honeypot field on forms to catch dumb bots
Bottom line: Your app's biggest exposure right now is the Firestore rules + no bot protection. A moderately skilled attacker could extract all participant data or flood your system with fake registrations today. Enabling Firebase App Check and tightening the Firestore rules would close ~80% of the attack surface.

Want me to implement any of these fixes?