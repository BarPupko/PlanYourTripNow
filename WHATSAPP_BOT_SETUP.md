# WhatsApp Bot Setup Guide for IVRI Tours

Your WhatsApp bot has been created and deployed to Firebase! Follow these steps to connect it with Twilio and start using it.

## Function URL
Your WhatsApp bot webhook is deployed at:
```
https://us-central1-planyourtrip-ed010.cloudfunctions.net/whatsappBot
```

---

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account
3. Complete the verification process
4. You'll get **$15 free trial credit** (enough for ~3,000 WhatsApp messages)

---

## Step 2: Set Up WhatsApp Sandbox (For Testing)

The WhatsApp Sandbox lets you test the bot immediately without waiting for approval.

1. Log into Twilio Console: [https://console.twilio.com](https://console.twilio.com)
2. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. You'll see instructions like:
   - Join your sandbox by sending a message to `+1 415 523 8886`
   - Send the code: `join [your-sandbox-code]`
4. Send that message from your WhatsApp to activate the sandbox

---

## Step 3: Configure the Webhook

1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Scroll to **Sandbox Configuration**
3. Under "WHEN A MESSAGE COMES IN", paste your webhook URL:
   ```
   https://us-central1-planyourtrip-ed010.cloudfunctions.net/whatsappBot
   ```
4. Make sure the method is set to **HTTP POST**
5. Click **Save**

---

## Step 4: Test Your Bot

Send a WhatsApp message to the Twilio number. Try these commands:

- `hi` - Get the help menu
- `trips` - List upcoming trips
- `who is going` - See participants for the next trip
- `gift card ABC123` - Check gift card balance (replace with actual code)
- `help` - Show all available commands

---

## Step 5: Production Setup (Optional - For Going Live)

Once you're ready to use a real WhatsApp Business number:

### 5a. Apply for WhatsApp Business API Access

1. In Twilio Console, go to **Messaging** → **Senders** → **WhatsApp senders**
2. Click **+ New Sender**
3. Follow the steps to:
   - Register your business
   - Verify your Facebook Business Manager account
   - Submit your WhatsApp Business Profile
   - Wait for Meta approval (typically 1-2 weeks)

### 5b. Get a WhatsApp-Enabled Number

You have two options:

**Option A: Use Your Existing Number**
- You can port your existing WhatsApp Business number to Twilio
- This requires verification and can take a few days

**Option B: Get a New Twilio Number**
1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number with WhatsApp capability
3. Cost: ~$1-2/month depending on country

### 5c. Update the Webhook

1. Go to **Messaging** → **Senders** → **WhatsApp senders**
2. Click on your approved sender
3. Under "Webhook Configuration", set the webhook URL to:
   ```
   https://us-central1-planyourtrip-ed010.cloudfunctions.net/whatsappBot
   ```
4. Save the configuration

---

## Available Bot Commands

Your WhatsApp assistant can handle these commands:

| Command | Example | What It Does |
|---------|---------|--------------|
| `hi` or `hello` | `hi` | Shows the help menu |
| `help` | `help` | Shows available commands |
| `trips` or `list` | `trips` | Lists all upcoming trips with dates, prices, and availability |
| `who is going` | `who is going to Masada?` | Shows participants for the next upcoming trip (shows names, seat numbers, payment status) |
| `gift card` | `gift card ABC123` | Checks gift card balance, status, and usage history |
| `book` | `book` | Shows instructions for booking via web dashboard |
| `cancel` | `cancel` | Shows instructions for cancellation |

---

## Bot Features

Your bot integrates directly with your Firestore database and can:

✅ **View Trips**
- Shows next 10 upcoming trips
- Displays date, price, available seats
- Sorted by date

✅ **Check Participants**
- Shows who's registered for trips
- Displays seat numbers
- Shows payment status (✅ paid, ⏳ pending)

✅ **Gift Card Lookup**
- Checks balance and expiry date
- Shows usage history
- Displays status (Active, Viewed, Partially Used, Fully Used, Expired)

✅ **Smart Responses**
- Natural language processing for commands
- Helpful error messages
- Links to web dashboard for complex actions

---

## Pricing

### Twilio Costs (Pay as you go):
- **WhatsApp Messages**: ~$0.005 per message
- **Example**: 100 conversations = ~$0.50
- **Phone Number**: $1-2/month (if you get a new number)

### Cost Estimate for Your Business:
- **Light use** (10-20 chats/day): ~$3-5/month
- **Medium use** (50-100 chats/day): ~$10-15/month
- **Heavy use** (200+ chats/day): ~$30-40/month

---

## Security & Best Practices

### Current Setup:
- ✅ Function reads data from Firestore (read-only for participants/trips)
- ✅ Sensitive operations (booking, canceling) redirect to web dashboard
- ✅ All queries use Firestore security rules
- ✅ Logs all messages for debugging

### Recommended Enhancements:
1. **Add authentication** - Verify sender's phone number
2. **Rate limiting** - Prevent spam/abuse
3. **Admin-only commands** - Restrict certain commands to authorized numbers
4. **Analytics** - Track command usage

---

## Troubleshooting

### Bot not responding?
1. Check Firebase Functions logs:
   ```bash
   cd tsms
   npm run logs
   ```
2. Verify webhook URL is correct in Twilio
3. Make sure Firestore security rules allow reads

### Messages delayed?
- WhatsApp Sandbox can have slight delays (1-3 seconds)
- Production numbers are faster

### Getting errors?
- Check the Firebase Console: [https://console.firebase.google.com/project/planyourtrip-ed010/functions](https://console.firebase.google.com/project/planyourtrip-ed010/functions)
- Look for error logs in the `whatsappBot` function

---

## Next Steps

1. ✅ Test all commands in the WhatsApp Sandbox
2. Apply for production WhatsApp Business API access (if needed)
3. Consider adding more commands:
   - Search trips by date range
   - Get trip details by name
   - Send reminders to participants
   - Broadcast messages to all registered users
4. Add analytics to track most-used commands
5. Implement admin authentication for sensitive operations

---

## Support Resources

- **Twilio WhatsApp Docs**: [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **Firebase Functions Logs**: Run `cd tsms && npm run logs`
- **Twilio Console**: [https://console.twilio.com](https://console.twilio.com)
- **Firebase Console**: [https://console.firebase.google.com/project/planyourtrip-ed010](https://console.firebase.google.com/project/planyourtrip-ed010)

---

## Example Conversation

```
You: hi
Bot: 🤖 IVRI Tours WhatsApp Assistant

Here's what I can help you with:

📋 TRIPS - View upcoming trips
👥 WHO [trip name] - See who's registered for a trip
🎫 BOOK [name] [trip] [seats] - Book someone for a trip
🎁 GIFT [code] - Check gift card balance
❌ CANCEL [registration] - Cancel a registration
❓ HELP - Show this message

Example: "who is going to Masada on Jan 15?"

---

You: trips
Bot: 🗓️ Upcoming Trips:

📍 Masada Sunrise Hike
   Date: 1/15/2026
   Price: $105
   Available: 34/40 seats

📍 Jerusalem Old City Tour
   Date: 1/22/2026
   Price: $75
   Available: 28/30 seats

---

You: who is going
Bot: 📍 Masada Sunrise Hike
Date: 1/15/2026
Registered: 6 people

👥 Participants:
✅ John Doe - Seat #5
✅ Jane Smith - Seat #12
⏳ David Cohen - Seat #23
...
```

Happy chatting! 🎉
