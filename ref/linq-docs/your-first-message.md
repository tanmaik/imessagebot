# Your First Message

Get up and running with the Linq Partner API in under 5 minutes. This guide walks you through sending your first message and receiving webhook notifications.

### Prerequisites

Before you begin, ensure you have:

* ✅ A Linq Partner API integration token
* ✅ At least one phone number provisioned in your organization
* ✅ Basic familiarity with REST APIs and webhooks

**Don't have an API token yet?** Contact your Linq representative to get started.

### Step 1: Send Your First Message

Let's send a simple text message to create a new chat conversation.

#### Create a Chat and Send Message

```bash
curl -X POST https://api.linqapp.com/api/partner/v2/chats \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_numbers": ["+15551234567"],
    "message": {
      "text": "Hello! This is my first message via the Linq API."
    },
    "phone_number": "+19998887777"
  }'
```

**Parameters:**

* `phone_numbers`: Array of recipient phone numbers (include country code)
* `message.text`: The text message to send
* `phone_number`: Your phone number to send from (must be in your organization)

#### Response

```json
{
  "data": {
    "chat": {
      "id": 12345,
      "display_name": "+1 (555) 123-4567",
      "service": "iMessage",
      "group": false,
      "message_count": 1
    },
    "message": {
      "id": 67890,
      "text": "Hello! This is my first message via the Linq API.",
      "sent_at": "2025-10-22T10:30:00Z",
      "delivery_status": "delivered"
    }
  }
}
```

🎉 **Success!** You've sent your first message. The response includes both the chat and message details.

### Step 2: List Your Phone Numbers

Check which phone numbers are available in your organization:

```bash
curl https://api.linqapp.com/api/partner/v2/phone_numbers \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here"
```

#### Response

```json
{
  "phone_numbers": [
    {
      "id": 99,
      "phone_number": "+19998887777",
      "forwarding_number": null,
      "response_rate": 75,
      "user": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### Step 3: Receive Messages with Webhooks

To receive incoming messages, you'll need to set up a webhook subscription.

#### Create Webhook Subscription

```bash
curl -X POST https://api.linqapp.com/api/partner/v2/webhook_subscriptions \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://your-app.com/webhooks/linq",
    "events": ["message.received", "message.sent"],
    "version": 2,
    "active": true
  }'
```

#### Webhook Payload Example

When a message is received, Linq will POST to your webhook URL:

```json
{
  "event": "message.received",
  "data": {
    "message": {
      "id": 67891,
      "text": "Thanks! This is my reply.",
      "sent_at": "2025-10-22T10:31:00Z",
      "sent_from": "+15551234567",
      "chat_id": 12345
    },
    "chat": {
      "id": 12345,
      "display_name": "+1 (555) 123-4567",
      "service": "iMessage"
    }
  },
  "timestamp": "2025-10-22T10:31:00Z"
}
```

**Important:** Always validate webhook signatures and implement idempotency to handle duplicate events.

### Step 4: Send a Message with Attachments

Enhance your messages with images, videos, or documents:

```bash
curl -X POST https://api.linqapp.com/api/partner/v2/chats/12345/chat_messages \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this image!",
    "attachment_urls": [
      "https://your-cdn.com/image.jpg"
    ]
  }'
```

**Supported file types:** Images (JPG, PNG, GIF), Videos (MP4, MOV), Documents (PDF, DOCX), and more.

### Step 5: React to Messages

Add reactions to messages for engagement tracking:

```bash
curl -X POST https://api.linqapp.com/api/partner/v2/chat_messages/67891/reactions \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "love",
    "operation": "add"
  }'
```

**Available reactions:** `love`, `like`, `dislike`, `laugh`, `emphasize`, `question`

### Phone Number Formatting

All phone numbers must follow these rules:

* **Format:** `+12223334444` or `2223334444`
* **Country code:** US country code (+1) is assumed if not provided
* **Normalization:** Linq automatically normalizes numbers on the backend

✅ Valid: `+15551234567`, `5551234567` ❌ Invalid: `555-123-4567`, `(555) 123-4567`

### Rate Limits

API requests are rate-limited to ensure system stability. If you exceed your limit, you'll receive a `429 Too Many Requests` response.

Contact your Linq representative to discuss your rate limits or request an increase based on your use case.

### Next Steps

Now that you've sent your first messages, explore the full API capabilities:

* 🔔 [**Webhook Events**](https://apidocs.linqapp.com/reference/webhook-events-documentation) - All available event types
* 👥 [**Contact Management**](https://apidocs.linqapp.com/reference/contacts) - Manage your address book
* 💬 [**Chat Operations**](https://apidocs.linqapp.com/reference/chats) - Group chats, read receipts, typing indicators

### Need Help?

* **Technical issues:** Contact your Linq representative
* **Feature requests:** Share feedback with your account team
* **Integration questions:** Consult the API Reference for detailed examples

***

**Ready to build?** Dive into the full API documentation to explore all available endpoints and features.
