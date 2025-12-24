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
