# Linq Partner API Documentation

Downloaded from: https://apidocs.linqapp.com/llms.txt

---


---

## Source: /start-here/introduction.md

# Introduction

## Welcome to the Linq Partner API

The Linq Partner API enables you to integrate iMessage, RCS, and SMS messaging directly into your applications. Build powerful conversational experiences, automate customer communication, and leverage the same messaging infrastructure trusted by 50,000+ teams.

### What You Can Build

With the Partner API, you can:

* **Send and receive iMessages, RCS, and SMS** at scale through your organization's phone numbers
* **Automate conversations** with customers, leads, and team members
* **Receive real-time notifications** via webhooks for incoming messages, reactions, and events
* **Manage contacts** across your organization
* **Track message delivery** with read receipts and delivery status

### Who Is This For?

The Partner API is designed for:

* **Software platforms** building messaging into their product
* **CRM and sales tools** adding conversational AI capabilities
* **Customer support platforms** offering multi-channel communication
* **Marketing automation tools** engaging customers via text
* **Developers** building custom messaging solutions

### Key Features

#### 🔄 Unified Messaging

Send iMessages and RCS with rich media (images, videos, documents) and automatically fall back to SMS when needed. One API for all three channels.

#### ⚡ Real-Time Webhooks

Receive instant notifications when messages arrive, contacts are updated, or users interact with your messages through reactions and typing indicators.

#### 📱 Full Message Features

Access the complete iMessage and RCS feature set:

* Read receipts and typing indicators
* Message reactions (love, like, laugh, etc.)
* Message editing and deletion
* Attachments and rich media
* Group conversations

#### 🔐 Secure & Reliable

All messages are sent through real phone numbers in your organization. Your integration token controls access and determines which phone numbers you can message from.

#### 📊 Contact Management

Maintain a centralized address book with automatic user assignment and organization-wide visibility.

### Use Cases

#### Customer Support Automation

Build AI-powered support agents that handle customer inquiries via text, with seamless handoff to human agents when needed.

#### Sales Engagement

Automate personalized outreach campaigns and follow-ups. Track responses and engagement in real-time.

#### Appointment Reminders

Send automated reminders for appointments, meetings, or events with two-way confirmation.

#### Lead Qualification

Qualify inbound leads through conversational flows before routing to your sales team.

#### Order Notifications

Keep customers informed about order status, shipping updates, and delivery notifications.

### Getting Started

Ready to start building? Head over to the Quick Start guide to send your first message in under 5 minutes.

Need help? Contact your Linq representative for API token provisioning and technical support.

***


---

## Source: /start-here/authentication.md

# Authentication

The Linq Partner API uses integration tokens for authentication. Your integration token determines which phone numbers you can message from and which organization data you can access.

Integration tokens are provided by your Linq representative. Contact your account manager to request a token or manage existing tokens.

⚠️ **Your integration token is a secret!** ⚠️ Keep it to yourself and don't push it to client side code. Use environmental variables or a secret key system to securely load your integration token into your project.

Integration tokens should be provided via the `X-LINQ-INTEGRATION-TOKEN` header.

```
X-LINQ-INTEGRATION-TOKEN: your_token_here
```

### Making Authenticated Requests

Include your token in the header of every API request:

```bash
curl https://api.linqapp.com/api/partner/v2/chats \
    -H "X-LINQ-INTEGRATION-TOKEN: your_token_here"
```

### Base URL

All API requests use the following Base URL:

```
https://api.linqapp.com
```

Combine this base URL with the endpoint paths shown in the API reference. For example:

* List chats: `https://api.linqapp.com/api/partner/v2/chats`
* Send a message: `https://api.linqapp.com/api/partner/v2/chat_messages`


---

## Source: /start-here/your-first-message.md

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


---

## Source: /start-here/sms-best-practices-faq.md

# SMS Best Practices FAQ

## SMS Best Practices and Limitations

### Overview

While the Linq API supports sending messages via iMessage, RCS, and SMS, the SMS channel has unique carrier-level limitations and filtering mechanisms that require special consideration. This guide outlines best practices for SMS messaging to ensure optimal delivery rates.

### Important: SMS vs. iMessage/RCS

**SMS is fundamentally different from iMessage and RCS.** While iMessage and RCS support rich media, long messages, and high-volume sending, SMS is subject to strict carrier-level filtering and throttling. For best results:

* **Use iMessage or RCS for**: Long-form content, media-rich messages, high-volume sending, digest/newsletter formats
* **Use SMS for**: Short, simple, human-like messages that mimic natural conversation patterns

### Carrier-Level Filtering

SMS messages pass through wireless carrier networks that employ sophisticated anti-spam systems. These systems:

* Work on **pattern recognition and risk scoring**
* Cause **silent failures** (messages appear sent but never deliver)
* Are **invisible to both Linq and your systems** (no error reporting)
* Use **progressive throttling** (once flagged, issues compound over time)

### Volume Limitations

#### Message Volume Thresholds

Carrier filtering is triggered by high-volume sending patterns:

* **10,000-16,000 messages within 5 days** has been observed to trigger carrier throttling
* Once throttling begins, delivery rates decline progressively
* Recovery requires reducing volume and changing sending patterns

#### Message Segmentation

SMS messages are limited to 160 characters per segment. Longer messages are automatically split:

* **160 characters or less**: 1 segment (optimal)
* **161-320 characters**: 2 segments
* **321-480 characters**: 3 segments
* And so on...

**Impact of long messages:**

* Each segment counts toward your send rate
* A 960-character message = 6 segments = 6x the throttling risk
* Messages over **6-10 segments (\~1,600 characters)** have extremely high failure rates

**Special character encoding:**

* Emoji and special characters force UCS-2 encoding
* UCS-2 encoding reduces segment size to **70 characters** per segment
* This effectively doubles your segment count for messages with special characters

#### Recommendation

**Keep SMS messages under 160 characters** whenever possible. For longer content, use iMessage or RCS instead.

### Content Best Practices

#### URLs and Links

Carriers actively filter messages containing certain link patterns:

1. **Multiple URLs in a single message**
   * Frequently silently blocked by carriers
   * **Solution**: Limit to one URL per message, or use iMessage/RCS
2. **Link shorteners and tracking URLs**
   * Carriers flag URL shorteners (bit.ly, tinyurl, etc.) as potential threats
   * Tracking parameters can trigger spam filters
   * **Solution**: Use direct, untracked URLs, or use iMessage/RCS for tracked links
3. **Suspicious domains**
   * New or unestablished domains may be flagged
   * **Solution**: Use established, recognizable domain names

#### Message Formatting

Carriers interpret certain formatting patterns as automated/bulk messaging:

**Avoid in SMS:**

* Bullet points and numbered lists
* Multiple paragraphs
* Digest or newsletter structures
* Highly formatted content
* Excessive punctuation or ALL CAPS

**Prefer in SMS:**

* Single paragraph, conversational text
* Natural sentence structure
* Human-like tone and pacing
* Simple, plain-text formatting

**For formatted content:** Use iMessage or RCS instead.

#### Special Characters and Emoji

* Emoji and special characters force UCS-2 encoding
* UCS-2 reduces message capacity from 160 to 70 characters per segment
* This doubles your segment count and accelerates throttling
* **Recommendation**: Avoid emoji in high-volume SMS. Use iMessage/RCS for emoji-rich messages.

### Media and Attachments

#### MMS (Multimedia Messaging)

Sending images and media via SMS/MMS has additional limitations:

1. **Faster throttling**
   * MMS triggers carrier limits faster than plain SMS
   * Multiple images accelerate rate limiting
2. **Delivery latency**
   * MMS messages deliver more slowly than SMS
   * Bandwidth constraints on carrier networks
3. **Out-of-order delivery**
   * MMS messages may arrive out of sequence
   * Especially problematic when mixing SMS and MMS in the same conversation

#### Recommendation

**For image and media sending, strongly prefer iMessage or RCS.** Only use MMS for occasional, low-frequency media sharing.

### Send Pacing

#### Human-Like Patterns

Carriers detect and filter automated sending patterns. To maintain deliverability:

1. **Implement send throttling**
   * Space out messages to mimic human conversation patterns
   * Avoid burst sending (many messages at once)
   * Consider implementing a queue system
2. **Vary send timing**
   * Don't send messages at perfectly regular intervals
   * Avoid sending large batches at the same time of day
3. **Monitor volume**
   * Track your daily and weekly SMS volume
   * If approaching 10,000+ messages in a 5-day period, consider switching to iMessage/RCS for some recipients

### Recovery from Throttling

If a phone number becomes flagged by carrier filtering:

1. **Reduce volume immediately** - Stop or significantly reduce SMS sending from that number
2. **Change content patterns** - Avoid the content types that triggered filtering
3. **Allow recovery time** - Carrier filters may take time to reset
4. **Contact Linq support** - We can work with carriers to investigate, but recovery is not guaranteed

**Prevention is critical** - Once flagged, a number may remain throttled even after reducing volume.

### Best Practices Summary

#### Do's ✓

* Keep messages under 160 characters
* Use single, direct URLs (no shorteners)
* Write in a natural, conversational tone
* Implement send pacing/throttling
* Monitor your sending volume
* Use iMessage/RCS for rich content, media, and high-volume sending

#### Don'ts ✗

* Don't send high-volume SMS (prefer iMessage/RCS for scale)
* Don't use multiple URLs in one message
* Don't use URL shorteners or tracking links
* Don't use bullet points, lists, or newsletter formatting
* Don't send long messages (over 160 characters)
* Don't send frequent MMS/images via SMS
* Don't use emoji or special characters in high-volume SMS
* Don't send in burst patterns

### When in Doubt

**Default to iMessage or RCS** for any messaging that involves:

* High volume (hundreds to thousands of messages)
* Long messages or rich formatting
* Multiple links or media attachments
* Marketing or newsletter content
* Time-sensitive delivery requirements

SMS should be reserved for **short, simple, conversational messages sent at human-like volumes and pacing.**

### Support

If you're experiencing SMS delivery issues or have questions about your specific use case, contact Linq support at <support@linqapp.com>.


---

## Source: /reference/getting-started.md

# Getting Started

All API requests use `https://api.linqapp.com` as the base URL and require authentication via the `X-LINQ-INTEGRATION-TOKEN` header. Your integration token determines which phone numbers you can message from and which organization data you can access.

```bash
curl https://api.linqapp.com/api/partner/v2/chats \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here"
```


---

## Source: /reference/key-concepts.md

# Key Concepts

* **Chats**: Conversation threads with one or more participants
* **Messages**: Individual messages within a chat, supporting text, attachments, and reactions
* **Phone Numbers**: Your organization's messaging-enabled phone numbers (iMessage, RCS, and SMS)
* **Contacts**: People in your organization's address book
* **Webhooks**: Real-time notifications for incoming messages, reactions, and events


---

## Source: /reference/chats.md

# Chats

A Chat is a collection of Chat Messages.

To begin a chat thread, you must create a Chat with at least one phone\_number and one message.

Including multiple phone\_numbers would create a group Chat.

The phone\_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.

You do not have to include your phone\_number in the phone\_numbers array when creating a Chat, only the recipients' phone\_numbers.

A PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.

## List Chats

> Retrieves a paginated list of chats for the authenticated partner filtered by phone number.

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Chat":{"type":"object","properties":{"id":{"type":"integer"},"display_name":{"type":"string","description":"The display name for the chat. Returns a manually set group name if present, otherwise a comma-separated list of participant names/phone numbers."},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service used for this chat"},"group":{"type":"boolean","description":"Whether this is a group chat"},"message_count":{"type":"integer","description":"Number of messages in the chat. For newly created chats, this will be 1 (the initial message). For existing chats, this could be any number."},"chat_handles":{"type":"array","items":{"$ref":"#/components/schemas/ChatHandle"}}}},"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}},"Pagination":{"type":"object","properties":{"page":{"type":"integer"},"total_pages":{"type":"integer"},"total_count":{"type":"integer"},"per_page":{"type":"integer"}}},"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats":{"get":{"tags":["Chats"],"summary":"List Chats","description":"Retrieves a paginated list of chats for the authenticated partner filtered by phone number.","parameters":[{"name":"phone_number","in":"query","required":true,"description":"Phone number to filter chats by. Returns all chats involving this phone number.","schema":{"type":"string"}},{"name":"page","in":"query","description":"Page number for pagination (default 1)","schema":{"type":"integer","default":1}},{"name":"per_page","in":"query","description":"Number of items per page (default 25, max 100)","schema":{"type":"integer","default":25,"maximum":100}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"type":"array","items":{"$ref":"#/components/schemas/Chat"}},"meta":{"$ref":"#/components/schemas/Pagination"}}}}}},"401":{"description":"Unauthorized","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Create Chat

> Creates a new chat with the specified phone numbers, or returns an existing chat if one already exists with the same participants. At least one phone number must be provided.\
> \
> \*\*Note:\*\* This endpoint uses "find or create" logic:\
> \- If a chat already exists with these participants, returns the existing chat (which may have many messages)\
> \- If no chat exists, creates a new chat with your initial message (will have \`message\_count: 1\`)<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}},"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}},"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats":{"post":{"tags":["Chats"],"summary":"Create Chat","description":"Creates a new chat with the specified phone numbers, or returns an existing chat if one already exists with the same participants. At least one phone number must be provided.\n\n**Note:** This endpoint uses \"find or create\" logic:\n- If a chat already exists with these participants, returns the existing chat (which may have many messages)\n- If no chat exists, creates a new chat with your initial message (will have `message_count: 1`)\n","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["chat","send_from","message"],"properties":{"send_from":{"type":"string","description":"Phone number to send from. This must be one of your organization's Linq phone numbers."},"chat":{"type":"object","required":["phone_numbers"],"properties":{"display_name":{"type":"string","description":"Display name for the chat (optional)"},"phone_numbers":{"type":"array","items":{"type":"string"},"description":"Phone numbers to include in the chat","minItems":1}}},"message":{"type":"object","description":"Initial message to send when creating the chat","required":["text"],"properties":{"text":{"type":"string","description":"Message text content"},"idempotency_key":{"type":"string","description":"Optional unique key to prevent duplicate messages. Must be alphanumeric and may include hyphens and underscores. If a message with this key was already sent, returns the existing message.","pattern":"^[a-zA-Z0-9_-]+$"},"attachments":{"type":"array","items":{"type":"string","format":"binary"},"description":"Optional file attachments to upload with the message. Files are uploaded as part of the multipart/form-data request. Include one field per file. Omit this field if not attaching files."},"attachment_urls":{"type":"array","items":{"type":"string"},"description":"Optional URLs of files to attach to the message. The API will download files from these URLs (must be publicly accessible). Uses a 30-second timeout per download. Can be used together with direct file uploads via `attachments`. Omit this field if not attaching files via URLs."}}}}}}}},"responses":{"200":{"description":"Chat created successfully (or existing chat returned if already exists)","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"type":"object","properties":{"id":{"type":"integer"},"display_name":{"type":"string"},"service":{"type":"string","enum":["iMessage","SMS","RCS"]},"group":{"type":"boolean"},"chat_handles":{"type":"array","items":{"$ref":"#/components/schemas/ChatHandle"}},"chat_messages":{"type":"object","description":"The initial message that was sent when creating the chat","properties":{"id":{"type":"integer"},"text":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"delivered_at":{"type":"string","format":"date-time","nullable":true,"description":"Timestamp when message was delivered. Initially null when message is pending, populated once delivered."},"delivery_status":{"type":"string","description":"Current delivery status. Starts as \"pending\", changes to \"delivered\" once successfully delivered.","enum":["pending","delivered","rate_limit_exceeded","paused"]},"is_read":{"type":"boolean"},"attachments":{"type":"array","description":"Array of attachments if any were included","items":{"$ref":"#/components/schemas/Attachment"}}}}}}}}}}},"400":{"description":"Bad request - Invalid or missing parameters (client-side error). Please verify all required parameters are included and properly formatted.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"422":{"description":"Validation error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Get Chat

> Retrieves details for a specific chat

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Chat":{"type":"object","properties":{"id":{"type":"integer"},"display_name":{"type":"string","description":"The display name for the chat. Returns a manually set group name if present, otherwise a comma-separated list of participant names/phone numbers."},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service used for this chat"},"group":{"type":"boolean","description":"Whether this is a group chat"},"message_count":{"type":"integer","description":"Number of messages in the chat. For newly created chats, this will be 1 (the initial message). For existing chats, this could be any number."},"chat_handles":{"type":"array","items":{"$ref":"#/components/schemas/ChatHandle"}}}},"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}},"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats/{chat_id}":{"get":{"tags":["Chats"],"summary":"Get Chat","description":"Retrieves details for a specific chat","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Chat"}}}}}},"404":{"description":"Chat not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Find Chat

> Finds a chat by phone numbers. Specify your Linq number via 'phone\_number' and the participant(s) you want to find a chat with via 'phone\_numbers\[]'. Returns the first matching chat.

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Chat":{"type":"object","properties":{"id":{"type":"integer"},"display_name":{"type":"string","description":"The display name for the chat. Returns a manually set group name if present, otherwise a comma-separated list of participant names/phone numbers."},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service used for this chat"},"group":{"type":"boolean","description":"Whether this is a group chat"},"message_count":{"type":"integer","description":"Number of messages in the chat. For newly created chats, this will be 1 (the initial message). For existing chats, this could be any number."},"chat_handles":{"type":"array","items":{"$ref":"#/components/schemas/ChatHandle"}}}},"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/chats/find":{"get":{"tags":["Chats"],"summary":"Find Chat","description":"Finds a chat by phone numbers. Specify your Linq number via 'phone_number' and the participant(s) you want to find a chat with via 'phone_numbers[]'. Returns the first matching chat.","parameters":[{"name":"phone_number","in":"query","required":true,"description":"Your Linq number (the phone number you're searching from)","schema":{"type":"string"}},{"name":"phone_numbers[]","in":"query","required":true,"description":"Array of phone numbers to find a chat with. Can be a single number or multiple numbers to find a group chat.","schema":{"type":"array","items":{"type":"string"}},"style":"form","explode":true}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"type":"object","oneOf":[{"type":"object","description":"When chat is found","properties":{"chat":{"$ref":"#/components/schemas/Chat"}}},{"type":"object","description":"When chat is not found","properties":{"chat":{"type":"null","nullable":true},"messages":{"type":"array","items":{"type":"object"}}}}]}}}}}}}}}}}
```

## Mark Chat as Read

> Marks all messages in a chat as read. This endpoint does not require a request body.

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/mark_as_read":{"put":{"tags":["Chats"],"summary":"Mark Chat as Read","description":"Marks all messages in a chat as read. This endpoint does not require a request body.","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"responses":{"204":{"description":"Chat marked as read successfully"},"404":{"description":"Chat not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Start Typing Indicator

> Sends a typing indicator to show that you are currently typing in the chat. This endpoint does not require a request body.\
> \
> The typing indicator has a default timeout of 60 seconds. Note that sending a message will automatically terminate the typing indicator without needing to call the DELETE endpoint.\
> \
> \*\*Note:\*\* By default, the Linq platform automatically displays typing indicators to make message responses appear more human-like. If you want to manually control typing indicators using this API, contact your Linq representative to disable automated typing indicators for your organization.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/start_typing":{"post":{"tags":["Chats"],"summary":"Start Typing Indicator","description":"Sends a typing indicator to show that you are currently typing in the chat. This endpoint does not require a request body.\n\nThe typing indicator has a default timeout of 60 seconds. Note that sending a message will automatically terminate the typing indicator without needing to call the DELETE endpoint.\n\n**Note:** By default, the Linq platform automatically displays typing indicators to make message responses appear more human-like. If you want to manually control typing indicators using this API, contact your Linq representative to disable automated typing indicators for your organization.\n","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"responses":{"201":{"description":"Typing indicator started successfully"},"404":{"description":"Chat not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Stop Typing Indicator

> Removes the typing indicator to show that you have stopped typing in the chat. This endpoint does not require a request body.\
> \
> \*\*Note:\*\* By default, the Linq platform automatically manages typing indicators. If you want to manually control typing indicators using this API, contact your Linq representative to disable automated typing indicators for your organization.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/stop_typing":{"delete":{"tags":["Chats"],"summary":"Stop Typing Indicator","description":"Removes the typing indicator to show that you have stopped typing in the chat. This endpoint does not require a request body.\n\n**Note:** By default, the Linq platform automatically manages typing indicators. If you want to manually control typing indicators using this API, contact your Linq representative to disable automated typing indicators for your organization.\n","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"responses":{"204":{"description":"Typing indicator stopped successfully"},"404":{"description":"Chat not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```

## Share Contact Card

> Shares your Linq contact card (name and image associated with your Linq number) with the participants in the chat. This endpoint does not require a request body.\
> \
> \*\*Note:\*\* Contact cards must be enabled for your users by the Linq team. Contact your Linq representative to enable this feature.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chats","description":"A Chat is a collection of Chat Messages.\n\nTo begin a chat thread, you must create a Chat with at least one phone_number and one message.\n\nIncluding multiple phone_numbers would create a group Chat.\n\nThe phone_number that all messages will originate from is based on your X-LINQ-INTEGRATION-TOKEN.\n\nYou do not have to include your phone_number in the phone_numbers array when creating a Chat, only the recipients' phone_numbers.\n\nA PhoneNumber is always normalized on Linq's end to assume a US country code, and append a +1 where no country code is provided. Phone Number format should be +12223334444 or 2223334444.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/share_contact":{"post":{"tags":["Chats"],"summary":"Share Contact Card","description":"Shares your Linq contact card (name and image associated with your Linq number) with the participants in the chat. This endpoint does not require a request body.\n\n**Note:** Contact cards must be enabled for your users by the Linq team. Contact your Linq representative to enable this feature.\n","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"responses":{"201":{"description":"Contact card shared successfully"},"404":{"description":"Chat not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```


---

## Source: /reference/chat-messages.md

# Chat Messages

Chat Messages are individual messages within a Chat thread.

Messages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.

## List Chat Messages

> Retrieves a paginated list of messages for a specific chat

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ChatMessage":{"type":"object","properties":{"id":{"type":"integer"},"text":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"delivered_at":{"type":"string","format":"date-time","nullable":true},"delivery_status":{"type":"string","enum":["pending","delivered","service_unavailable","paused"],"description":"Current delivery status of the message"},"edited_at":{"type":"string","format":"date-time","nullable":true},"is_read":{"type":"boolean"},"sent_from":{"type":"string","description":"The phone number or identifier that sent this message"},"chat_handle_id":{"type":"integer"},"attachments":{"type":"array","items":{"$ref":"#/components/schemas/Attachment"}},"reactions":{"type":"array","items":{"$ref":"#/components/schemas/Reaction"}}}},"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}},"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}},"Pagination":{"type":"object","properties":{"page":{"type":"integer"},"total_pages":{"type":"integer"},"total_count":{"type":"integer"},"per_page":{"type":"integer"}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/chat_messages":{"get":{"tags":["Chat Messages"],"summary":"List Chat Messages","description":"Retrieves a paginated list of messages for a specific chat","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}},{"name":"page","in":"query","description":"Page number for pagination (default 1)","schema":{"type":"integer","default":1}},{"name":"per_page","in":"query","description":"Number of items per page (default 25, max 100)","schema":{"type":"integer","default":25,"maximum":100}},{"name":"before","in":"query","description":"Filter messages sent before this timestamp (ISO 8601 format)","schema":{"type":"string","format":"date-time"}},{"name":"after","in":"query","description":"Filter messages sent after this timestamp (ISO 8601 format)","schema":{"type":"string","format":"date-time"}},{"name":"sort","in":"query","description":"Sort order for messages (default is chronological/ascending)","schema":{"type":"string","enum":["asc","desc"],"default":"asc"}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"type":"array","items":{"$ref":"#/components/schemas/ChatMessage"}},"meta":{"$ref":"#/components/schemas/Pagination"}}}}}}}}}}}
```

## Send Message

> Sends a new message in the specified chat.\
> \
> \*\*Idempotency:\*\* To prevent duplicate messages (e.g., due to network retries), include a unique \`message\[idempotency\_key]\` in your request. If a message with the same key was already sent, the API will return the existing message with a 200 status instead of creating a duplicate. The idempotency key must be alphanumeric and may include hyphens and underscores.\
> \
> \*\*Attachments:\*\* You can attach files in two ways:\
> 1\. \*\*Direct upload\*\* - Use \`message\[attachments]\[]\` fields in your multipart/form-data request to upload files directly:\
> \`\`\`bash\
> -F "message\[attachments]\[]=@file1.jpg" \\\
> -F "message\[attachments]\[]=@file2.png"\
> \`\`\`\
> 2\. \*\*URLs\*\* - Use \`message\[attachment\_urls]\[]\` to provide URLs of files. The API will download them from the provided URLs (must be publicly accessible, 30-second timeout per download):\
> \`\`\`bash\
> -F "message\[attachment\_urls]\[]=<https://example.com/document.pdf>" \\\
> -F "message\[attachment\_urls]\[]=<https://example.com/image.jpg"\\>
> \`\`\`\
> \
> Both methods can be used together in the same message.<br>

````json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ChatMessage":{"type":"object","properties":{"id":{"type":"integer"},"text":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"delivered_at":{"type":"string","format":"date-time","nullable":true},"delivery_status":{"type":"string","enum":["pending","delivered","service_unavailable","paused"],"description":"Current delivery status of the message"},"edited_at":{"type":"string","format":"date-time","nullable":true},"is_read":{"type":"boolean"},"sent_from":{"type":"string","description":"The phone number or identifier that sent this message"},"chat_handle_id":{"type":"integer"},"attachments":{"type":"array","items":{"$ref":"#/components/schemas/Attachment"}},"reactions":{"type":"array","items":{"$ref":"#/components/schemas/Reaction"}}}},"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}},"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/chat_messages":{"post":{"tags":["Chat Messages"],"summary":"Send Message","description":"Sends a new message in the specified chat.\n\n**Idempotency:** To prevent duplicate messages (e.g., due to network retries), include a unique `message[idempotency_key]` in your request. If a message with the same key was already sent, the API will return the existing message with a 200 status instead of creating a duplicate. The idempotency key must be alphanumeric and may include hyphens and underscores.\n\n**Attachments:** You can attach files in two ways:\n1. **Direct upload** - Use `message[attachments][]` fields in your multipart/form-data request to upload files directly:\n```bash\n-F \"message[attachments][]=@file1.jpg\" \\\n-F \"message[attachments][]=@file2.png\"\n```\n2. **URLs** - Use `message[attachment_urls][]` to provide URLs of files. The API will download them from the provided URLs (must be publicly accessible, 30-second timeout per download):\n```bash\n-F \"message[attachment_urls][]=https://example.com/document.pdf\" \\\n-F \"message[attachment_urls][]=https://example.com/image.jpg\"\n```\n\nBoth methods can be used together in the same message.\n","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"multipart/form-data":{"schema":{"type":"object","required":["message[text]"],"properties":{"message[text]":{"type":"string","description":"The message text content"},"message[idempotency_key]":{"type":"string","description":"Optional unique key to prevent duplicate messages. Must be alphanumeric and may include hyphens and underscores.","pattern":"^[a-zA-Z0-9_-]+$"},"message[attachments][]":{"type":"array","items":{"type":"string","format":"binary"},"description":"Optional file attachments to upload. Include one field per file (e.g., message[attachments][]=@file1.jpg message[attachments][]=@file2.png). Omit this field if not uploading files."},"message[attachment_urls][]":{"type":"array","items":{"type":"string"},"description":"Optional URLs of files to attach. The API will download files from these URLs (must be publicly accessible). Uses a 30-second timeout per download. Omit this field if not attaching files via URLs."}}}}}},"responses":{"201":{"description":"Message sent successfully","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/ChatMessage"}}}}}}}}}}}
````

## Get Chat Message

> Retrieves details for a specific message

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ChatMessage":{"type":"object","properties":{"id":{"type":"integer"},"text":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"delivered_at":{"type":"string","format":"date-time","nullable":true},"delivery_status":{"type":"string","enum":["pending","delivered","service_unavailable","paused"],"description":"Current delivery status of the message"},"edited_at":{"type":"string","format":"date-time","nullable":true},"is_read":{"type":"boolean"},"sent_from":{"type":"string","description":"The phone number or identifier that sent this message"},"chat_handle_id":{"type":"integer"},"attachments":{"type":"array","items":{"$ref":"#/components/schemas/Attachment"}},"reactions":{"type":"array","items":{"$ref":"#/components/schemas/Reaction"}}}},"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}},"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/chats/{chat_id}/chat_messages/{id}":{"get":{"tags":["Chat Messages"],"summary":"Get Chat Message","description":"Retrieves details for a specific message","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}},{"name":"id","in":"path","required":true,"description":"The message ID","schema":{"type":"integer"}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/ChatMessage"}}}}}}}}}}}
```

## Delete Message

> Deletes a message from the chat

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/api/partner/v2/chats/{chat_id}/chat_messages/{id}":{"delete":{"tags":["Chat Messages"],"summary":"Delete Message","description":"Deletes a message from the chat","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}},{"name":"id","in":"path","required":true,"description":"The message ID","schema":{"type":"integer"}}],"responses":{"200":{"description":"Message deleted successfully","content":{"application/json":{"schema":{"type":"object","properties":{"message":{"type":"string"}}}}}}}}}}}
```

## Edit Message

> Edits an existing message in the chat

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/api/partner/v2/chats/{chat_id}/chat_messages/{id}/edit":{"post":{"tags":["Chat Messages"],"summary":"Edit Message","description":"Edits an existing message in the chat","parameters":[{"name":"chat_id","in":"path","required":true,"description":"The chat ID","schema":{"type":"integer"}},{"name":"id","in":"path","required":true,"description":"The message ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["text"],"properties":{"text":{"type":"string"}}}}}},"responses":{"200":{"description":"Message edited successfully","content":{"application/json":{"schema":{"type":"object","properties":{"message":{"type":"string"},"data":{"type":"object","properties":{"id":{"type":"integer"},"text":{"type":"string"}}}}}}}}}}}}}
```

## React to Message

> Adds or removes a reaction from a message

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/chat_messages/{chat_message_id}/reactions":{"post":{"tags":["Chat Messages"],"summary":"React to Message","description":"Adds or removes a reaction from a message","parameters":[{"name":"chat_message_id","in":"path","required":true,"description":"The message ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["type","operation"],"properties":{"type":{"type":"string","description":"The type of reaction","enum":["love","like","dislike","laugh","emphasize","question"]},"operation":{"type":"string","description":"Whether to add or remove the reaction","enum":["add","remove"]}}}}}},"responses":{"201":{"description":"Reaction added successfully","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Reaction"}}}}}}}}}}}
```

## Get Chat Message Reaction

> Retrieves details for a specific reaction

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Chat Messages","description":"Chat Messages are individual messages within a Chat thread.\n\nMessages can include text, attachments, and reactions. All messages are associated with a specific Chat and sent from a phone number in your organization.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/chat_message_reactions/{reaction_id}":{"get":{"tags":["Chat Messages"],"summary":"Get Chat Message Reaction","description":"Retrieves details for a specific reaction","parameters":[{"name":"reaction_id","in":"path","required":true,"description":"The reaction ID","schema":{"type":"integer"}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Reaction"}}}}}}}}}}}
```


---

## Source: /reference/contacts.md

# Contacts

Contacts represent people in your organization's address book.

Each contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.

## List Contacts

> Retrieves a paginated list of all contacts in your organization

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts":{"get":{"tags":["Contacts"],"summary":"List Contacts","description":"Retrieves a paginated list of all contacts in your organization","parameters":[{"name":"page","in":"query","description":"Page number for pagination (default 1)","schema":{"type":"integer","default":1}},{"name":"per_page","in":"query","description":"Number of items per page (default 25, max 100)","schema":{"type":"integer","default":25,"maximum":100}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"contacts":{"type":"array","items":{"$ref":"#/components/schemas/Contact"}},"pagination":{"type":"object","properties":{"current_page":{"type":"integer"},"per_page":{"type":"integer"},"total_pages":{"type":"integer"},"total_count":{"type":"integer"}}}}}}}},"500":{"description":"Internal server error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Create Contact

> Creates a new contact. You can optionally specify a user\_email to assign the contact to a specific user in your organization. If not provided, the contact will be automatically associated with the first admin user.\
> \
> \*\*Note:\*\* At least one of the following fields must be provided: \`first\_name\`, \`last\_name\`, \`email\`, or \`phone\_number\`. Attempting to create a contact without any of these fields will result in a 422 validation error.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ContactInput":{"type":"object","required":["contact"],"properties":{"contact":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"}}},"user_email":{"type":"string","description":"Optional email of the user in your organization who should own this contact. Must be an existing user in your organization. If not provided, defaults to the first admin user."}}},"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts":{"post":{"tags":["Contacts"],"summary":"Create Contact","description":"Creates a new contact. You can optionally specify a user_email to assign the contact to a specific user in your organization. If not provided, the contact will be automatically associated with the first admin user.\n\n**Note:** At least one of the following fields must be provided: `first_name`, `last_name`, `email`, or `phone_number`. Attempting to create a contact without any of these fields will result in a 422 validation error.\n","requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ContactInput"}}}},"responses":{"201":{"description":"Contact created successfully","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Contact"}}}}}},"422":{"description":"Validation error or User not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Get Contact

> Retrieves details for a specific contact

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts/{id}":{"get":{"tags":["Contacts"],"summary":"Get Contact","description":"Retrieves details for a specific contact","parameters":[{"name":"id","in":"path","required":true,"description":"The contact ID","schema":{"type":"integer"}}],"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Contact"}}}}}},"404":{"description":"Contact not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Update Contact

> Updates an existing contact. Only the fields provided will be updated.\
> \
> \*\*At least one of the following fields must be provided:\*\*\
> \- \`first\_name\`\
> \- \`last\_name\`\
> \- \`email\`\
> \- \`phone\_number\`\
> \
> \*\*Additional optional fields:\*\*\
> \- \`company\`\
> \- \`title\`\
> \- \`location\`\
> \- \`user\_email\` (to change contact owner)<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ContactInput":{"type":"object","required":["contact"],"properties":{"contact":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"}}},"user_email":{"type":"string","description":"Optional email of the user in your organization who should own this contact. Must be an existing user in your organization. If not provided, defaults to the first admin user."}}},"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts/{id}":{"put":{"tags":["Contacts"],"summary":"Update Contact","description":"Updates an existing contact. Only the fields provided will be updated.\n\n**At least one of the following fields must be provided:**\n- `first_name`\n- `last_name`\n- `email`\n- `phone_number`\n\n**Additional optional fields:**\n- `company`\n- `title`\n- `location`\n- `user_email` (to change contact owner)\n","parameters":[{"name":"id","in":"path","required":true,"description":"The contact ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ContactInput"}}}},"responses":{"200":{"description":"Contact updated successfully","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Contact"}}}}}},"404":{"description":"Contact not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Delete Contact

> Deletes a contact and all associated user contacts. This action cannot be undone.

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts/{id}":{"delete":{"tags":["Contacts"],"summary":"Delete Contact","description":"Deletes a contact and all associated user contacts. This action cannot be undone.","parameters":[{"name":"id","in":"path","required":true,"description":"The contact ID","schema":{"type":"integer"}}],"responses":{"204":{"description":"Contact deleted successfully"},"404":{"description":"Contact not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Partially Update Contact

> Partially updates an existing contact. Only the fields provided will be updated. Functionally identical to PUT.\
> \
> \*\*At least one of the following fields must be provided:\*\*\
> \- \`first\_name\`\
> \- \`last\_name\`\
> \- \`email\`\
> \- \`phone\_number\`\
> \
> \*\*Additional optional fields:\*\*\
> \- \`company\`\
> \- \`title\`\
> \- \`location\`\
> \- \`user\_email\` (to change contact owner)<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"ContactInput":{"type":"object","required":["contact"],"properties":{"contact":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"}}},"user_email":{"type":"string","description":"Optional email of the user in your organization who should own this contact. Must be an existing user in your organization. If not provided, defaults to the first admin user."}}},"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts/{id}":{"patch":{"tags":["Contacts"],"summary":"Partially Update Contact","description":"Partially updates an existing contact. Only the fields provided will be updated. Functionally identical to PUT.\n\n**At least one of the following fields must be provided:**\n- `first_name`\n- `last_name`\n- `email`\n- `phone_number`\n\n**Additional optional fields:**\n- `company`\n- `title`\n- `location`\n- `user_email` (to change contact owner)\n","parameters":[{"name":"id","in":"path","required":true,"description":"The contact ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ContactInput"}}}},"responses":{"200":{"description":"Contact updated successfully","content":{"application/json":{"schema":{"type":"object","properties":{"data":{"$ref":"#/components/schemas/Contact"}}}}}},"404":{"description":"Contact not found","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```

## Find Contact

> Finds a contact by email or phone number. At least one search parameter must be provided.\
> \
> If both email and phone\_number are provided, the search uses OR logic (returns the contact if either matches).\
> \
> \*\*Phone Number Handling:\*\* Phone numbers are automatically normalized to E.164 format before searching. You can provide phone numbers in various formats (e.g., "(555) 123-4567", "555-123-4567", "+15551234567") and they will be normalized for matching.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Contacts","description":"Contacts represent people in your organization's address book.\n\nEach contact can be assigned to a specific user in your organization. If no user is specified when creating a contact, it will be automatically assigned to the first admin user.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}},"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}},"paths":{"/api/partner/v2/contacts/find":{"get":{"tags":["Contacts"],"summary":"Find Contact","description":"Finds a contact by email or phone number. At least one search parameter must be provided.\n\nIf both email and phone_number are provided, the search uses OR logic (returns the contact if either matches).\n\n**Phone Number Handling:** Phone numbers are automatically normalized to E.164 format before searching. You can provide phone numbers in various formats (e.g., \"(555) 123-4567\", \"555-123-4567\", \"+15551234567\") and they will be normalized for matching.\n","parameters":[{"name":"email","in":"query","description":"Email address to search for","schema":{"type":"string","format":"email"}},{"name":"phone_number","in":"query","description":"Phone number to search for. The API will automatically normalize it to E.164 format for searching (e.g., \"+15551234567\").","schema":{"type":"string"}}],"responses":{"200":{"description":"Successful response (returns contact if found, or null if not found)","content":{"application/json":{"schema":{"oneOf":[{"$ref":"#/components/schemas/Contact"},{"type":"object","properties":{"contact":{"type":"null"}}}]}}}},"400":{"description":"Bad request - Missing search parameters (client-side error). Please verify all required parameters are included and properly formatted.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}},"422":{"description":"Validation error - Invalid email or phone format","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}},"500":{"description":"Internal server error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/StandardError"}}}}}}}}}
```


---

## Source: /reference/phone-numbers.md

# Phone Numbers

Phone Numbers represent the messaging-enabled phone numbers in your organization, supporting iMessage, RCS, and SMS.

Each phone number is associated with a user and can be used to send and receive messages. Messages are automatically sent using the best available protocol (iMessage → RCS → SMS). Phone numbers can have forwarding numbers configured.

## List Phone Numbers

> Retrieves all phone numbers associated with the authenticated partner organization

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Phone Numbers","description":"Phone Numbers represent the messaging-enabled phone numbers in your organization, supporting iMessage, RCS, and SMS.\n\nEach phone number is associated with a user and can be used to send and receive messages. Messages are automatically sent using the best available protocol (iMessage → RCS → SMS). Phone numbers can have forwarding numbers configured.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"PhoneNumber":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string"},"forwarding_number":{"type":"string","nullable":true,"description":"Phone number where calls are forwarded when this number is unavailable"},"response_rate":{"type":"integer","description":"Response rate as messages per second"}}}}},"paths":{"/api/partner/v2/phone_numbers":{"get":{"tags":["Phone Numbers"],"summary":"List Phone Numbers","description":"Retrieves all phone numbers associated with the authenticated partner organization","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"phone_numbers":{"type":"array","items":{"$ref":"#/components/schemas/PhoneNumber"}}}}}}}}}}}}
```

## Update Phone Number

> Updates the forwarding number for a phone number. The forwarding number is where calls will be forwarded to when the primary number is unavailable.\
> \
> Pass an empty string to clear the forwarding number.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Phone Numbers","description":"Phone Numbers represent the messaging-enabled phone numbers in your organization, supporting iMessage, RCS, and SMS.\n\nEach phone number is associated with a user and can be used to send and receive messages. Messages are automatically sent using the best available protocol (iMessage → RCS → SMS). Phone numbers can have forwarding numbers configured.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"PhoneNumber":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string"},"forwarding_number":{"type":"string","nullable":true,"description":"Phone number where calls are forwarded when this number is unavailable"},"response_rate":{"type":"integer","description":"Response rate as messages per second"}}},"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}},"paths":{"/api/partner/v2/phone_numbers/{id}":{"put":{"tags":["Phone Numbers"],"summary":"Update Phone Number","description":"Updates the forwarding number for a phone number. The forwarding number is where calls will be forwarded to when the primary number is unavailable.\n\nPass an empty string to clear the forwarding number.\n","parameters":[{"name":"id","in":"path","required":true,"description":"The phone number ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","properties":{"forwarding_number":{"type":"string","description":"The phone number to forward calls to when unavailable (pass empty string to clear)","nullable":true}}}}}},"responses":{"200":{"description":"Phone number updated successfully","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PhoneNumber"}}}},"403":{"description":"Forbidden - Phone number doesn't belong to your organization","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"422":{"description":"Unprocessable entity - Invalid forwarding number","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}}}}
```


---

## Source: /reference/webhook-subscriptions.md

# Webhook Subscriptions

Webhook Subscriptions allow you to receive real-time notifications when events occur in your organization.

Configure webhook endpoints to receive events such as messages sent/received, reactions, typing indicators, and more.

## List Webhook Subscriptions

> Retrieves all webhook subscriptions for the authenticated partner

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Webhook Subscriptions","description":"Webhook Subscriptions allow you to receive real-time notifications when events occur in your organization.\n\nConfigure webhook endpoints to receive events such as messages sent/received, reactions, typing indicators, and more.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"WebhookSubscription":{"type":"object","properties":{"id":{"type":"integer"},"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version of the webhook subscription"},"events":{"type":"array","items":{"type":"string"}},"active":{"type":"boolean"},"secret_configured":{"type":"boolean","description":"Whether a secret has been configured for this webhook (the actual secret is never returned)"},"last_delivered_at":{"type":"string","format":"date-time","nullable":true,"description":"Timestamp of the last successful webhook delivery"},"delivery_attempts":{"type":"integer","description":"Total number of delivery attempts for this webhook"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/webhook_subscriptions":{"get":{"tags":["Webhook Subscriptions"],"summary":"List Webhook Subscriptions","description":"Retrieves all webhook subscriptions for the authenticated partner","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"webhook_subscriptions":{"type":"array","items":{"$ref":"#/components/schemas/WebhookSubscription"}}}}}}}}}}}}
```

## Create Webhook Subscription

> Creates a new webhook subscription for specific event types.\
> \
> \*\*Note:\*\* Creating multiple webhook subscriptions with the same URL and events will result in duplicate webhook deliveries for those events. Ensure you don't create duplicate subscriptions unless intentional.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Webhook Subscriptions","description":"Webhook Subscriptions allow you to receive real-time notifications when events occur in your organization.\n\nConfigure webhook endpoints to receive events such as messages sent/received, reactions, typing indicators, and more.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"WebhookSubscriptionInput":{"type":"object","required":["webhook_url","events","version"],"properties":{"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version (should be 2 for v2)"},"secret":{"type":"string","description":"Secret key for webhook signature verification"},"active":{"type":"boolean","description":"Whether the webhook subscription is active"},"events":{"type":"array","items":{"type":"string","enum":["message.sent","message.received","message.read","call.completed","reaction.sent","reaction.received","typing_indicator.received","typing_indicator.removed","contact.created","contact.updated","contact.deleted","participant.added","participant.removed"]}}}},"WebhookSubscription":{"type":"object","properties":{"id":{"type":"integer"},"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version of the webhook subscription"},"events":{"type":"array","items":{"type":"string"}},"active":{"type":"boolean"},"secret_configured":{"type":"boolean","description":"Whether a secret has been configured for this webhook (the actual secret is never returned)"},"last_delivered_at":{"type":"string","format":"date-time","nullable":true,"description":"Timestamp of the last successful webhook delivery"},"delivery_attempts":{"type":"integer","description":"Total number of delivery attempts for this webhook"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/webhook_subscriptions":{"post":{"tags":["Webhook Subscriptions"],"summary":"Create Webhook Subscription","description":"Creates a new webhook subscription for specific event types.\n\n**Note:** Creating multiple webhook subscriptions with the same URL and events will result in duplicate webhook deliveries for those events. Ensure you don't create duplicate subscriptions unless intentional.\n","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["webhook_subscription"],"properties":{"webhook_subscription":{"$ref":"#/components/schemas/WebhookSubscriptionInput"}}}}}},"responses":{"201":{"description":"Webhook subscription created successfully","content":{"application/json":{"schema":{"type":"object","properties":{"webhook_subscription":{"$ref":"#/components/schemas/WebhookSubscription"}}}}}}}}}}}
```

## Update Webhook Subscription

> Updates an existing webhook subscription

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Webhook Subscriptions","description":"Webhook Subscriptions allow you to receive real-time notifications when events occur in your organization.\n\nConfigure webhook endpoints to receive events such as messages sent/received, reactions, typing indicators, and more.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}},"schemas":{"WebhookSubscriptionInput":{"type":"object","required":["webhook_url","events","version"],"properties":{"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version (should be 2 for v2)"},"secret":{"type":"string","description":"Secret key for webhook signature verification"},"active":{"type":"boolean","description":"Whether the webhook subscription is active"},"events":{"type":"array","items":{"type":"string","enum":["message.sent","message.received","message.read","call.completed","reaction.sent","reaction.received","typing_indicator.received","typing_indicator.removed","contact.created","contact.updated","contact.deleted","participant.added","participant.removed"]}}}},"WebhookSubscription":{"type":"object","properties":{"id":{"type":"integer"},"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version of the webhook subscription"},"events":{"type":"array","items":{"type":"string"}},"active":{"type":"boolean"},"secret_configured":{"type":"boolean","description":"Whether a secret has been configured for this webhook (the actual secret is never returned)"},"last_delivered_at":{"type":"string","format":"date-time","nullable":true,"description":"Timestamp of the last successful webhook delivery"},"delivery_attempts":{"type":"integer","description":"Total number of delivery attempts for this webhook"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}},"paths":{"/api/partner/v2/webhook_subscriptions/{webhook_subscription_id}":{"put":{"tags":["Webhook Subscriptions"],"summary":"Update Webhook Subscription","description":"Updates an existing webhook subscription","parameters":[{"name":"webhook_subscription_id","in":"path","required":true,"description":"The webhook subscription ID","schema":{"type":"integer"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["webhook_subscription"],"properties":{"webhook_subscription":{"$ref":"#/components/schemas/WebhookSubscriptionInput"}}}}}},"responses":{"200":{"description":"Webhook subscription updated successfully","content":{"application/json":{"schema":{"type":"object","properties":{"webhook_subscription":{"$ref":"#/components/schemas/WebhookSubscription"}}}}}}}}}}}
```

## Delete Webhook Subscription

> Deletes a webhook subscription

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Webhook Subscriptions","description":"Webhook Subscriptions allow you to receive real-time notifications when events occur in your organization.\n\nConfigure webhook endpoints to receive events such as messages sent/received, reactions, typing indicators, and more.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/api/partner/v2/webhook_subscriptions/{webhook_subscription_id}":{"delete":{"tags":["Webhook Subscriptions"],"summary":"Delete Webhook Subscription","description":"Deletes a webhook subscription","parameters":[{"name":"webhook_subscription_id","in":"path","required":true,"description":"The webhook subscription ID","schema":{"type":"integer"}}],"responses":{"204":{"description":"Webhook subscription deleted successfully"}}}}}}
```


---

## Source: /reference/webhook-events-documentation.md

# Webhook Events Documentation

Documentation for all available webhook events and their payload structures.

## Webhook Events Reference (Documentation Only)

> \*\*Note: This is a documentation endpoint only - it does not exist in the actual API\*\*\
> \
> \## Webhook Events Overview\
> \
> Linq V2 provides real-time event notifications via webhooks. When specific events occur in your Linq account, we send HTTP POST requests to your configured endpoint.\
> \
> \## Available Webhook Events\
> \
> \| Event Type | Description | When Triggered |\
> \|------------|-------------|----------------|\
> \| \`message.sent\` | Message sent from Linq | When a message is sent from a Linq user |\
> \| \`message.received\` | Message received by Linq | When a message is received by a Linq user |\
> \| \`message.read\` | Message marked as read | When messages are marked as read |\
> \| \`call.completed\` | Call completed | When a voice call has been completed |\
> \| \`reaction.sent\` | Reaction sent by a Linq number | When a Linq number sends a reaction to a message |\
> \| \`reaction.received\` | Reaction received from another party | When a reaction is received from another party |\
> \| \`typing\_indicator.received\` | Typing indicator displayed | When a typing indicator is displayed |\
> \| \`typing\_indicator.removed\` | Typing indicator removed | When a typing indicator is removed |\
> \| \`contact.created\` | Contact created | When a contact is created via the API |\
> \| \`contact.updated\` | Contact updated | When a contact is updated via the API |\
> \| \`contact.deleted\` | Contact deleted | When a contact is deleted via the API |\
> \| \`participant.added\` | Participant added to group chat | When someone is added to a group conversation |\
> \| \`participant.removed\` | Participant removed from group chat | When someone leaves or is removed from a group conversation |\
> \
> \## Webhook Payload Structure\
> \
> All webhook events follow this standard format:\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-06-01T10:00:00-06:00",\
> &#x20; "data": {\
> &#x20;   // Event-specific data\
> &#x20; },\
> &#x20; "event\_id": "9dabceb9-9194-4dc6-beda-892573f377b4",\
> &#x20; "event\_type": "message.sent"\
> }\
> \`\`\`\
> \
> \*\*Field Descriptions:\*\*\
> \- \`event\_type\`: The type of webhook event (e.g., "message.sent", "message.received")\
> \- \`api\_version\`: Always "v2" for V2 webhooks\
> \- \`data\`: Event-specific payload data (structure varies by event type)\
> \- \`created\_at\`: Timestamp when the event was created (ISO 8601 format with timezone)\
> \- \`event\_id\`: Unique identifier for this webhook event (UUID format)\
> \
> \## Webhook Signature Verification\
> \
> Linq signs all webhook requests with a secret key to allow you to verify that webhooks are genuinely from Linq. When creating a webhook subscription, you can optionally provide a \`secret\` value. If provided, Linq will include an \`X-Webhook-Signature\` header with each webhook request.\
> \
> \### Signature Format\
> \
> The signature is computed using HMAC-SHA256:\
> \
> \`\`\`\
> X-Webhook-Signature: sha256=\<hex\_digest>\
> \`\`\`\
> \
> \### Verifying Signatures\
> \
> To verify a webhook signature:\
> \
> 1\. \*\*Extract the signature\*\* from the \`X-Webhook-Signature\` header\
> 2\. \*\*Compute the expected signature\*\* using HMAC-SHA256 with your webhook secret and the raw request body\
> 3\. \*\*Compare\*\* the computed signature with the received signature\
> \
> \*\*Important:\*\* The signature is computed on the canonical JSON format (with keys sorted recursively). Make sure to use the raw request body exactly as received.\
> \
> \### Example Verification (Ruby)\
> \
> \`\`\`ruby\
> require 'openssl'\
> require 'json'\
> \
> def verify\_webhook\_signature(secret, payload, signature\_header)\
> &#x20; \# Extract the hex digest from the header\
> &#x20; expected\_signature = signature\_header.sub(/^sha256=/, '')\
> \
> &#x20; \# Compute HMAC-SHA256 of the raw payload\
> &#x20; computed\_signature = OpenSSL::HMAC.hexdigest('SHA256', secret, payload)\
> \
> &#x20; \# Compare signatures securely\
> &#x20; ActiveSupport::SecurityUtils.secure\_compare(computed\_signature, expected\_signature)\
> end\
> \
> \# Usage in your webhook endpoint\
> secret = 'your\_webhook\_secret'\
> payload = request.raw\_post\
> signature = request.headers\['X-Webhook-Signature']\
> \
> if verify\_webhook\_signature(secret, payload, signature)\
> &#x20; \# Signature is valid, process webhook\
> else\
> &#x20; \# Invalid signature, reject request\
> &#x20; render json: { error: 'Invalid signature' }, status: :unauthorized\
> end\
> \`\`\`\
> \
> \### Example Verification (Node.js)\
> \
> \`\`\`javascript\
> const crypto = require('crypto');\
> \
> function verifyWebhookSignature(secret, payload, signatureHeader) {\
> &#x20; // Extract the hex digest from the header\
> &#x20; const expectedSignature = signatureHeader.replace(/^sha256=/, '');\
> \
> &#x20; // Compute HMAC-SHA256 of the raw payload\
> &#x20; const computedSignature = crypto\
> &#x20;   .createHmac('sha256', secret)\
> &#x20;   .update(payload)\
> &#x20;   .digest('hex');\
> \
> &#x20; // Compare signatures securely (constant-time comparison)\
> &#x20; return crypto.timingSafeEqual(\
> &#x20;   Buffer.from(computedSignature),\
> &#x20;   Buffer.from(expectedSignature)\
> &#x20; );\
> }\
> \
> // Usage in your webhook endpoint\
> const secret = 'your\_webhook\_secret';\
> const payload = req.rawBody; // Raw request body as string\
> const signature = req.headers\['x-webhook-signature'];\
> \
> if (verifyWebhookSignature(secret, payload, signature)) {\
> &#x20; // Signature is valid, process webhook\
> } else {\
> &#x20; // Invalid signature, reject request\
> &#x20; res.status(401).json({ error: 'Invalid signature' });\
> }\
> \`\`\`\
> \
> \## Event Payload Examples\
> \
> \### Message Sent/Received Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-05-21T15:30:00-06:00",\
> &#x20; "data": {\
> &#x20;   "id": "27799380",\
> &#x20;   "chat\_id": "324324",\
> &#x20;   "text": "Hello, how are you?",\
> &#x20;   "sent\_at": "2025-05-21 15:30:00 -0600",\
> &#x20;   "is\_read": false,\
> &#x20;   "from\_phone": "+15551234567",\
> &#x20;   "service": "iMessage",\
> &#x20;   "reaction\_id": null,\
> &#x20;   "chat\_handles": \[\
> &#x20;     {\
> &#x20;       "identifier": "+15551234567",\
> &#x20;       "display\_name": "John Doe",\
> &#x20;       "is\_me": false\
> &#x20;     },\
> &#x20;     {\
> &#x20;       "identifier": "+15559876543",\
> &#x20;       "display\_name": "Your Linq Number",\
> &#x20;       "is\_me": true\
> &#x20;     }\
> &#x20;   ],\
> &#x20;   "attachments": \[\
> &#x20;     {\
> &#x20;       "id": "abc12345-1234-5678-9abc-def012345678",\
> &#x20;       "url": "<https://storage.googleapis.com/linq-files/attachments/abc123.pdf",\\>
> &#x20;       "filename": "document.pdf",\
> &#x20;       "mime\_type": "application/pdf"\
> &#x20;     }\
> &#x20;   ]\
> &#x20; },\
> &#x20; "event\_id": "9dabceb9-9194-4dc6-beda-892573f377b4",\
> &#x20; "event\_type": "message.received"\
> }\
> \`\`\`\
> \
> \### Message Read Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-05-21T15:35:00-06:00",\
> &#x20; "data": {\
> &#x20;   "id": "12345",\
> &#x20;   "chat\_id": "67890",\
> &#x20;   "read\_at": "2025-05-21T15:35:00-06:00"\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_789ghi",\
> &#x20; "event\_type": "message.read"\
> }\
> \`\`\`\
> \
> \### Call Completed Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-05-21T15:05:30-06:00",\
> &#x20; "data": {\
> &#x20;   "id": "12345",\
> &#x20;   "to": "+15559876543",\
> &#x20;   "from": "+15551234567",\
> &#x20;   "status": "completed",\
> &#x20;   "direction": "inbound",\
> &#x20;   "start\_time": "2025-05-21 15:00:00 -0600",\
> &#x20;   "end\_time": "2025-05-21 15:05:30 -0600",\
> &#x20;   "duration": 330,\
> &#x20;   "call\_type": "normal",\
> &#x20;   "forwarded\_from": null,\
> &#x20;   "answered\_by": "+15559876543",\
> &#x20;   "voicemail": false,\
> &#x20;   "has\_recording": true,\
> &#x20;   "recording\_data": {\
> &#x20;     "id": "67890",\
> &#x20;     "url": "<https://storage.googleapis.com/linq-files/recordings/abc123.mp3",\\>
> &#x20;     "duration": 330,\
> &#x20;     "transcribed": true,\
> &#x20;     "transcript\_available": true,\
> &#x20;     "transcription": "Hello, this is John calling about our meeting tomorrow\...",\
> &#x20;     "summary": "John called to confirm tomorrow's meeting at 2pm."\
> &#x20;   }\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_101jkl",\
> &#x20; "event\_type": "call.completed"\
> }\
> \`\`\`\
> \
> \### Contact Created/Updated Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-07-30T10:00:00-06:00",\
> &#x20; "data": {\
> &#x20;   "id": 123,\
> &#x20;   "first\_name": "John",\
> &#x20;   "last\_name": "Doe",\
> &#x20;   "full\_name": "John Doe",\
> &#x20;   "email": "<john@example.com>",\
> &#x20;   "phone\_number": "+15551234567",\
> &#x20;   "company": "Acme Corp",\
> &#x20;   "title": "CEO",\
> &#x20;   "location": "San Francisco, CA",\
> &#x20;   "image\_url": null,\
> &#x20;   "created\_at": "2025-07-30T10:00:00-06:00",\
> &#x20;   "updated\_at": "2025-07-30T10:00:00-06:00",\
> &#x20;   "contact\_owner": {\
> &#x20;     "id": 456,\
> &#x20;     "email": "<owner@company.com>",\
> &#x20;     "first\_name": "Jane",\
> &#x20;     "last\_name": "Owner",\
> &#x20;     "name": "Jane Owner"\
> &#x20;   }\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_contact\_123",\
> &#x20; "event\_type": "contact.created"\
> }\
> \`\`\`\
> \
> \### Contact Deleted Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-07-30T10:00:00-06:00",\
> &#x20; "data": {\
> &#x20;   "id": 123\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_contact\_deleted\_123",\
> &#x20; "event\_type": "contact.deleted"\
> }\
> \`\`\`\
> \
> \*\*Note:\*\* The \`contact.deleted\` event only includes the contact ID, not the full contact data or owner information.\
> \
> \### Reaction Sent/Received Event\
> \
> The \`reaction\` field supports the following values:\
> \- \`love\` - Love/heart reaction\
> \- \`like\` - Like/thumbs up reaction\
> \- \`dislike\` - Dislike/thumbs down reaction\
> \- \`laugh\` - Laugh/haha reaction\
> \- \`emphasize\` - Emphasize/!! reaction\
> \- \`question\` - Question/? reaction\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-07-10T15:31:00-06:00",\
> &#x20; "data": {\
> &#x20;   "id": "12346",\
> &#x20;   "chat\_message\_id": "67891",\
> &#x20;   "chat\_id": "11111",\
> &#x20;   "reaction": "like",\
> &#x20;   "is\_from\_me": false,\
> &#x20;   "sent\_at": "2025-07-10 15:31:00 -0600",\
> &#x20;   "created\_at": "2025-07-10 15:31:00 -0600",\
> &#x20;   "chat\_handle": {\
> &#x20;     "id": "22223",\
> &#x20;     "identifier": "+15551234567"\
> &#x20;   },\
> &#x20;   "chat\_handles": \[\
> &#x20;     {\
> &#x20;       "identifier": "+15551234567",\
> &#x20;       "display\_name": "John Doe",\
> &#x20;       "is\_me": false\
> &#x20;     },\
> &#x20;     {\
> &#x20;       "identifier": "+15559876543",\
> &#x20;       "display\_name": "Your Linq Number",\
> &#x20;       "is\_me": true\
> &#x20;     }\
> &#x20;   ],\
> &#x20;   "associated\_message": {\
> &#x20;     "id": "67891",\
> &#x20;     "text": "I'm doing great, thanks!",\
> &#x20;     "sent\_at": "2025-07-10 15:30:30 -0600"\
> &#x20;   }\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_456deg",\
> &#x20; "event\_type": "reaction.received"\
> }\
> \`\`\`\
> \
> \### Typing Indicator Received/Removed Event\
> \
> \`\`\`json\
> {\
> &#x20; "api\_version": "v2",\
> &#x20; "created\_at": "2025-07-10T15:32:00-06:00",\
> &#x20; "data": {\
> &#x20;   "chat\_id": "11111",\
> &#x20;   "display": true,\
> &#x20;   "timestamp": "2025-07-10 15:32:00 -0600",\
> &#x20;   "chat\_handles": \[\
> &#x20;     {\
> &#x20;       "identifier": "+15551234567",\
> &#x20;       "display\_name": "John Doe",\
> &#x20;       "is\_me": false\
> &#x20;     },\
> &#x20;     {\
> &#x20;       "identifier": "+15559876543",\
> &#x20;       "display\_name": "Your Linq Number",\
> &#x20;       "is\_me": true\
> &#x20;     }\
> &#x20;   ]\
> &#x20; },\
> &#x20; "event\_id": "wh\_evt\_789ghi",\
> &#x20; "event\_type": "typing\_indicator.received"\
> }\
> \`\`\`\
> \
> \## Webhook Security\
> \
> \### Signature Verification\
> \
> All webhooks include a signature in the \`X-Webhook-Signature\` header. Verify the signature to ensure the webhook is from Linq:\
> \
> \`\`\`javascript\
> const crypto = require('crypto');\
> \
> function verifyWebhookSignature(body, signature, secret) {\
> &#x20; const expectedSignature = crypto\
> &#x20;   .createHmac('sha256', secret)\
> &#x20;   .update(body)\
> &#x20;   .digest('hex');\
> &#x20; return \`sha256=${expectedSignature}\` === signature;\
> }\
> \`\`\`\
> \
> \### Python Example\
> \
> \`\`\`python\
> import hmac\
> import hashlib\
> \
> def verify\_webhook(payload, signature, secret):\
> &#x20;   expected = hmac.new(\
> &#x20;       secret.encode(),\
> &#x20;       payload.encode(),\
> &#x20;       hashlib.sha256\
> &#x20;   ).hexdigest()\
> &#x20;   return f"sha256={expected}" == signature\
> \`\`\`\
> \
> \## Integration Steps\
> \
> 1\. \*\*Create a webhook endpoint\*\* on your server that can receive POST requests\
> 2\. \*\*Create a webhook subscription\*\* using \`POST /api/partner/v2/webhook\_subscriptions\`\
> 3\. \*\*Store your webhook secret\*\* securely for signature verification\
> 4\. \*\*Verify signatures\*\* on all incoming webhooks\
> 5\. \*\*Respond with HTTP 200\*\* within 10 seconds to acknowledge receipt\
> 6\. \*\*Process webhooks asynchronously\*\* to avoid timeouts\
> \
> \## Testing Webhooks\
> \
> Use tools like ngrok or webhook.site to test webhook integrations during development:\
> \
> \`\`\`bash\
> \# Using ngrok\
> ngrok http 3000\
> \
> \# Then use the ngrok URL as your webhook endpoint\
> \`\`\`\
> \
> \## Error Handling\
> \
> Your webhook endpoint should:\
> \- Return HTTP 200 for successful receipt\
> \- Return appropriate error codes (400, 500) for failures\
> \- Log all webhook events for debugging\
> \- Implement idempotency to handle duplicate events<br>

````json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Webhook Events Documentation","description":"Documentation for all available webhook events and their payload structures.\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/webhooks/events":{"get":{"tags":["Webhook Events Documentation"],"summary":"Webhook Events Reference (Documentation Only)","description":"**Note: This is a documentation endpoint only - it does not exist in the actual API**\n\n## Webhook Events Overview\n\nLinq V2 provides real-time event notifications via webhooks. When specific events occur in your Linq account, we send HTTP POST requests to your configured endpoint.\n\n## Available Webhook Events\n\n| Event Type | Description | When Triggered |\n|------------|-------------|----------------|\n| `message.sent` | Message sent from Linq | When a message is sent from a Linq user |\n| `message.received` | Message received by Linq | When a message is received by a Linq user |\n| `message.read` | Message marked as read | When messages are marked as read |\n| `call.completed` | Call completed | When a voice call has been completed |\n| `reaction.sent` | Reaction sent by a Linq number | When a Linq number sends a reaction to a message |\n| `reaction.received` | Reaction received from another party | When a reaction is received from another party |\n| `typing_indicator.received` | Typing indicator displayed | When a typing indicator is displayed |\n| `typing_indicator.removed` | Typing indicator removed | When a typing indicator is removed |\n| `contact.created` | Contact created | When a contact is created via the API |\n| `contact.updated` | Contact updated | When a contact is updated via the API |\n| `contact.deleted` | Contact deleted | When a contact is deleted via the API |\n| `participant.added` | Participant added to group chat | When someone is added to a group conversation |\n| `participant.removed` | Participant removed from group chat | When someone leaves or is removed from a group conversation |\n\n## Webhook Payload Structure\n\nAll webhook events follow this standard format:\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-06-01T10:00:00-06:00\",\n  \"data\": {\n    // Event-specific data\n  },\n  \"event_id\": \"9dabceb9-9194-4dc6-beda-892573f377b4\",\n  \"event_type\": \"message.sent\"\n}\n```\n\n**Field Descriptions:**\n- `event_type`: The type of webhook event (e.g., \"message.sent\", \"message.received\")\n- `api_version`: Always \"v2\" for V2 webhooks\n- `data`: Event-specific payload data (structure varies by event type)\n- `created_at`: Timestamp when the event was created (ISO 8601 format with timezone)\n- `event_id`: Unique identifier for this webhook event (UUID format)\n\n## Webhook Signature Verification\n\nLinq signs all webhook requests with a secret key to allow you to verify that webhooks are genuinely from Linq. When creating a webhook subscription, you can optionally provide a `secret` value. If provided, Linq will include an `X-Webhook-Signature` header with each webhook request.\n\n### Signature Format\n\nThe signature is computed using HMAC-SHA256:\n\n```\nX-Webhook-Signature: sha256=<hex_digest>\n```\n\n### Verifying Signatures\n\nTo verify a webhook signature:\n\n1. **Extract the signature** from the `X-Webhook-Signature` header\n2. **Compute the expected signature** using HMAC-SHA256 with your webhook secret and the raw request body\n3. **Compare** the computed signature with the received signature\n\n**Important:** The signature is computed on the canonical JSON format (with keys sorted recursively). Make sure to use the raw request body exactly as received.\n\n### Example Verification (Ruby)\n\n```ruby\nrequire 'openssl'\nrequire 'json'\n\ndef verify_webhook_signature(secret, payload, signature_header)\n  # Extract the hex digest from the header\n  expected_signature = signature_header.sub(/^sha256=/, '')\n\n  # Compute HMAC-SHA256 of the raw payload\n  computed_signature = OpenSSL::HMAC.hexdigest('SHA256', secret, payload)\n\n  # Compare signatures securely\n  ActiveSupport::SecurityUtils.secure_compare(computed_signature, expected_signature)\nend\n\n# Usage in your webhook endpoint\nsecret = 'your_webhook_secret'\npayload = request.raw_post\nsignature = request.headers['X-Webhook-Signature']\n\nif verify_webhook_signature(secret, payload, signature)\n  # Signature is valid, process webhook\nelse\n  # Invalid signature, reject request\n  render json: { error: 'Invalid signature' }, status: :unauthorized\nend\n```\n\n### Example Verification (Node.js)\n\n```javascript\nconst crypto = require('crypto');\n\nfunction verifyWebhookSignature(secret, payload, signatureHeader) {\n  // Extract the hex digest from the header\n  const expectedSignature = signatureHeader.replace(/^sha256=/, '');\n\n  // Compute HMAC-SHA256 of the raw payload\n  const computedSignature = crypto\n    .createHmac('sha256', secret)\n    .update(payload)\n    .digest('hex');\n\n  // Compare signatures securely (constant-time comparison)\n  return crypto.timingSafeEqual(\n    Buffer.from(computedSignature),\n    Buffer.from(expectedSignature)\n  );\n}\n\n// Usage in your webhook endpoint\nconst secret = 'your_webhook_secret';\nconst payload = req.rawBody; // Raw request body as string\nconst signature = req.headers['x-webhook-signature'];\n\nif (verifyWebhookSignature(secret, payload, signature)) {\n  // Signature is valid, process webhook\n} else {\n  // Invalid signature, reject request\n  res.status(401).json({ error: 'Invalid signature' });\n}\n```\n\n## Event Payload Examples\n\n### Message Sent/Received Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-05-21T15:30:00-06:00\",\n  \"data\": {\n    \"id\": \"27799380\",\n    \"chat_id\": \"324324\",\n    \"text\": \"Hello, how are you?\",\n    \"sent_at\": \"2025-05-21 15:30:00 -0600\",\n    \"is_read\": false,\n    \"from_phone\": \"+15551234567\",\n    \"service\": \"iMessage\",\n    \"reaction_id\": null,\n    \"chat_handles\": [\n      {\n        \"identifier\": \"+15551234567\",\n        \"display_name\": \"John Doe\",\n        \"is_me\": false\n      },\n      {\n        \"identifier\": \"+15559876543\",\n        \"display_name\": \"Your Linq Number\",\n        \"is_me\": true\n      }\n    ],\n    \"attachments\": [\n      {\n        \"id\": \"abc12345-1234-5678-9abc-def012345678\",\n        \"url\": \"https://storage.googleapis.com/linq-files/attachments/abc123.pdf\",\n        \"filename\": \"document.pdf\",\n        \"mime_type\": \"application/pdf\"\n      }\n    ]\n  },\n  \"event_id\": \"9dabceb9-9194-4dc6-beda-892573f377b4\",\n  \"event_type\": \"message.received\"\n}\n```\n\n### Message Read Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-05-21T15:35:00-06:00\",\n  \"data\": {\n    \"id\": \"12345\",\n    \"chat_id\": \"67890\",\n    \"read_at\": \"2025-05-21T15:35:00-06:00\"\n  },\n  \"event_id\": \"wh_evt_789ghi\",\n  \"event_type\": \"message.read\"\n}\n```\n\n### Call Completed Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-05-21T15:05:30-06:00\",\n  \"data\": {\n    \"id\": \"12345\",\n    \"to\": \"+15559876543\",\n    \"from\": \"+15551234567\",\n    \"status\": \"completed\",\n    \"direction\": \"inbound\",\n    \"start_time\": \"2025-05-21 15:00:00 -0600\",\n    \"end_time\": \"2025-05-21 15:05:30 -0600\",\n    \"duration\": 330,\n    \"call_type\": \"normal\",\n    \"forwarded_from\": null,\n    \"answered_by\": \"+15559876543\",\n    \"voicemail\": false,\n    \"has_recording\": true,\n    \"recording_data\": {\n      \"id\": \"67890\",\n      \"url\": \"https://storage.googleapis.com/linq-files/recordings/abc123.mp3\",\n      \"duration\": 330,\n      \"transcribed\": true,\n      \"transcript_available\": true,\n      \"transcription\": \"Hello, this is John calling about our meeting tomorrow...\",\n      \"summary\": \"John called to confirm tomorrow's meeting at 2pm.\"\n    }\n  },\n  \"event_id\": \"wh_evt_101jkl\",\n  \"event_type\": \"call.completed\"\n}\n```\n\n### Contact Created/Updated Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-07-30T10:00:00-06:00\",\n  \"data\": {\n    \"id\": 123,\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"full_name\": \"John Doe\",\n    \"email\": \"john@example.com\",\n    \"phone_number\": \"+15551234567\",\n    \"company\": \"Acme Corp\",\n    \"title\": \"CEO\",\n    \"location\": \"San Francisco, CA\",\n    \"image_url\": null,\n    \"created_at\": \"2025-07-30T10:00:00-06:00\",\n    \"updated_at\": \"2025-07-30T10:00:00-06:00\",\n    \"contact_owner\": {\n      \"id\": 456,\n      \"email\": \"owner@company.com\",\n      \"first_name\": \"Jane\",\n      \"last_name\": \"Owner\",\n      \"name\": \"Jane Owner\"\n    }\n  },\n  \"event_id\": \"wh_evt_contact_123\",\n  \"event_type\": \"contact.created\"\n}\n```\n\n### Contact Deleted Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-07-30T10:00:00-06:00\",\n  \"data\": {\n    \"id\": 123\n  },\n  \"event_id\": \"wh_evt_contact_deleted_123\",\n  \"event_type\": \"contact.deleted\"\n}\n```\n\n**Note:** The `contact.deleted` event only includes the contact ID, not the full contact data or owner information.\n\n### Reaction Sent/Received Event\n\nThe `reaction` field supports the following values:\n- `love` - Love/heart reaction\n- `like` - Like/thumbs up reaction\n- `dislike` - Dislike/thumbs down reaction\n- `laugh` - Laugh/haha reaction\n- `emphasize` - Emphasize/!! reaction\n- `question` - Question/? reaction\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-07-10T15:31:00-06:00\",\n  \"data\": {\n    \"id\": \"12346\",\n    \"chat_message_id\": \"67891\",\n    \"chat_id\": \"11111\",\n    \"reaction\": \"like\",\n    \"is_from_me\": false,\n    \"sent_at\": \"2025-07-10 15:31:00 -0600\",\n    \"created_at\": \"2025-07-10 15:31:00 -0600\",\n    \"chat_handle\": {\n      \"id\": \"22223\",\n      \"identifier\": \"+15551234567\"\n    },\n    \"chat_handles\": [\n      {\n        \"identifier\": \"+15551234567\",\n        \"display_name\": \"John Doe\",\n        \"is_me\": false\n      },\n      {\n        \"identifier\": \"+15559876543\",\n        \"display_name\": \"Your Linq Number\",\n        \"is_me\": true\n      }\n    ],\n    \"associated_message\": {\n      \"id\": \"67891\",\n      \"text\": \"I'm doing great, thanks!\",\n      \"sent_at\": \"2025-07-10 15:30:30 -0600\"\n    }\n  },\n  \"event_id\": \"wh_evt_456deg\",\n  \"event_type\": \"reaction.received\"\n}\n```\n\n### Typing Indicator Received/Removed Event\n\n```json\n{\n  \"api_version\": \"v2\",\n  \"created_at\": \"2025-07-10T15:32:00-06:00\",\n  \"data\": {\n    \"chat_id\": \"11111\",\n    \"display\": true,\n    \"timestamp\": \"2025-07-10 15:32:00 -0600\",\n    \"chat_handles\": [\n      {\n        \"identifier\": \"+15551234567\",\n        \"display_name\": \"John Doe\",\n        \"is_me\": false\n      },\n      {\n        \"identifier\": \"+15559876543\",\n        \"display_name\": \"Your Linq Number\",\n        \"is_me\": true\n      }\n    ]\n  },\n  \"event_id\": \"wh_evt_789ghi\",\n  \"event_type\": \"typing_indicator.received\"\n}\n```\n\n## Webhook Security\n\n### Signature Verification\n\nAll webhooks include a signature in the `X-Webhook-Signature` header. Verify the signature to ensure the webhook is from Linq:\n\n```javascript\nconst crypto = require('crypto');\n\nfunction verifyWebhookSignature(body, signature, secret) {\n  const expectedSignature = crypto\n    .createHmac('sha256', secret)\n    .update(body)\n    .digest('hex');\n  return `sha256=${expectedSignature}` === signature;\n}\n```\n\n### Python Example\n\n```python\nimport hmac\nimport hashlib\n\ndef verify_webhook(payload, signature, secret):\n    expected = hmac.new(\n        secret.encode(),\n        payload.encode(),\n        hashlib.sha256\n    ).hexdigest()\n    return f\"sha256={expected}\" == signature\n```\n\n## Integration Steps\n\n1. **Create a webhook endpoint** on your server that can receive POST requests\n2. **Create a webhook subscription** using `POST /api/partner/v2/webhook_subscriptions`\n3. **Store your webhook secret** securely for signature verification\n4. **Verify signatures** on all incoming webhooks\n5. **Respond with HTTP 200** within 10 seconds to acknowledge receipt\n6. **Process webhooks asynchronously** to avoid timeouts\n\n## Testing Webhooks\n\nUse tools like ngrok or webhook.site to test webhook integrations during development:\n\n```bash\n# Using ngrok\nngrok http 3000\n\n# Then use the ngrok URL as your webhook endpoint\n```\n\n## Error Handling\n\nYour webhook endpoint should:\n- Return HTTP 200 for successful receipt\n- Return appropriate error codes (400, 500) for failures\n- Log all webhook events for debugging\n- Implement idempotency to handle duplicate events\n","responses":{"200":{"description":"This endpoint is for documentation purposes only"}}}}}}
````


---

## Source: /reference/utilities.md

# Utilities

Utility endpoints for checking iMessage availability and other helper functions. Note that messages automatically use the best available protocol (iMessage → RCS → SMS).

## Check iMessage Availability

> Checks if a phone number is registered with iMessage.\
> \
> \*\*Rate Limit:\*\* This endpoint is limited to 1 request per 10 seconds. Exceeding this limit will result in a \`429\` error response.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Utilities","description":"Utility endpoints for checking iMessage availability and other helper functions. Note that messages automatically use the best available protocol (iMessage → RCS → SMS).\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/api/partner/v2/i_message_availability/check":{"post":{"tags":["Utilities"],"summary":"Check iMessage Availability","description":"Checks if a phone number is registered with iMessage.\n\n**Rate Limit:** This endpoint is limited to 1 request per 10 seconds. Exceeding this limit will result in a `429` error response.\n","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["phone_number"],"properties":{"phone_number":{"type":"string"}}}}}},"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"available":{"type":"boolean"},"phone_number":{"type":"string"}}}}}}}}}}}
```


---

## Source: /reference/models.md

# Models

## The Error object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Error":{"type":"object","description":"Standard error format used by most endpoints (render_error format)","properties":{"errors":{"type":"array","items":{"type":"object","properties":{"status":{"type":"integer"},"code":{"type":"string"},"title":{"type":"string"},"detail":{"type":"string"}}}}}}}}}
```

## The StandardError object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"StandardError":{"type":"object","description":"Alternative error format used by Contacts and Webhook Subscriptions endpoints (render_standard_error format)","properties":{"status":{"type":"string"},"error_code":{"type":"string"},"message":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}}}}}}}
```

## The Pagination object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Pagination":{"type":"object","properties":{"page":{"type":"integer"},"total_pages":{"type":"integer"},"total_count":{"type":"integer"},"per_page":{"type":"integer"}}}}}}
```

## The Chat object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Chat":{"type":"object","properties":{"id":{"type":"integer"},"display_name":{"type":"string","description":"The display name for the chat. Returns a manually set group name if present, otherwise a comma-separated list of participant names/phone numbers."},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service used for this chat"},"group":{"type":"boolean","description":"Whether this is a group chat"},"message_count":{"type":"integer","description":"Number of messages in the chat. For newly created chats, this will be 1 (the initial message). For existing chats, this could be any number."},"chat_handles":{"type":"array","items":{"$ref":"#/components/schemas/ChatHandle"}}}},"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}}}}}
```

## The ChatHandle object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"ChatHandle":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string","description":"The phone number or email identifier for this participant"},"service":{"type":"string","enum":["iMessage","SMS","RCS"],"description":"The messaging service for this handle"},"joined_at":{"type":"string","format":"date-time"}}}}}}
```

## The ChatMessage object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"ChatMessage":{"type":"object","properties":{"id":{"type":"integer"},"text":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"delivered_at":{"type":"string","format":"date-time","nullable":true},"delivery_status":{"type":"string","enum":["pending","delivered","service_unavailable","paused"],"description":"Current delivery status of the message"},"edited_at":{"type":"string","format":"date-time","nullable":true},"is_read":{"type":"boolean"},"sent_from":{"type":"string","description":"The phone number or identifier that sent this message"},"chat_handle_id":{"type":"integer"},"attachments":{"type":"array","items":{"$ref":"#/components/schemas/Attachment"}},"reactions":{"type":"array","items":{"$ref":"#/components/schemas/Reaction"}}}},"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}},"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}}}
```

## The Attachment object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Attachment":{"type":"object","properties":{"id":{"type":"string","format":"uuid","description":"Unique identifier for the attachment"},"url":{"type":"string"},"filename":{"type":"string"},"mime_type":{"type":"string"},"file_size":{"type":"integer"}}}}}}
```

## The Reaction object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Reaction":{"type":"object","properties":{"id":{"type":"integer"},"chat_message_id":{"type":"integer"},"reaction":{"type":"string","enum":["love","like","dislike","laugh","emphasize","question"],"description":"The type of reaction"},"is_from_me":{"type":"boolean"},"from_phone":{"type":"string"},"sent_at":{"type":"string","format":"date-time"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}}}
```

## The Contact object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"Contact":{"type":"object","properties":{"id":{"type":"integer"},"first_name":{"type":"string"},"last_name":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"},"image_url":{"type":"string","nullable":true},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"contact_owner":{"type":"object","nullable":true,"description":"The user who owns this contact in your organization","properties":{"id":{"type":"integer"},"email":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"name":{"type":"string"}}}}}}}}
```

## The ContactInput object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"ContactInput":{"type":"object","required":["contact"],"properties":{"contact":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone_number":{"type":"string"},"company":{"type":"string"},"title":{"type":"string"},"location":{"type":"string"}}},"user_email":{"type":"string","description":"Optional email of the user in your organization who should own this contact. Must be an existing user in your organization. If not provided, defaults to the first admin user."}}}}}}
```

## The PhoneNumber object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"PhoneNumber":{"type":"object","properties":{"id":{"type":"integer"},"phone_number":{"type":"string"},"forwarding_number":{"type":"string","nullable":true,"description":"Phone number where calls are forwarded when this number is unavailable"},"response_rate":{"type":"integer","description":"Response rate as messages per second"}}}}}}
```

## The WebhookSubscription object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"WebhookSubscription":{"type":"object","properties":{"id":{"type":"integer"},"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version of the webhook subscription"},"events":{"type":"array","items":{"type":"string"}},"active":{"type":"boolean"},"secret_configured":{"type":"boolean","description":"Whether a secret has been configured for this webhook (the actual secret is never returned)"},"last_delivered_at":{"type":"string","format":"date-time","nullable":true,"description":"Timestamp of the last successful webhook delivery"},"delivery_attempts":{"type":"integer","description":"Total number of delivery attempts for this webhook"},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"}}}}}}
```

## The WebhookSubscriptionInput object

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"components":{"schemas":{"WebhookSubscriptionInput":{"type":"object","required":["webhook_url","events","version"],"properties":{"webhook_url":{"type":"string"},"version":{"type":"integer","description":"API version (should be 2 for v2)"},"secret":{"type":"string","description":"Secret key for webhook signature verification"},"active":{"type":"boolean","description":"Whether the webhook subscription is active"},"events":{"type":"array","items":{"type":"string","enum":["message.sent","message.received","message.read","call.completed","reaction.sent","reaction.received","typing_indicator.received","typing_indicator.removed","contact.created","contact.updated","contact.deleted","participant.added","participant.removed"]}}}}}}}
```

