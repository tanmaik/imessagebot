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
