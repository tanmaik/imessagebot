# Utilities

Utility endpoints for checking iMessage availability and other helper functions. Note that messages automatically use the best available protocol (iMessage → RCS → SMS).

## Check iMessage Availability

> Checks if a phone number is registered with iMessage.\
> \
> \*\*Rate Limit:\*\* This endpoint is limited to 1 request per 10 seconds. Exceeding this limit will result in a \`429\` error response.<br>

```json
{"openapi":"3.0.3","info":{"title":"Linq Partner API","version":"2.0.0"},"tags":[{"name":"Utilities","description":"Utility endpoints for checking iMessage availability and other helper functions. Note that messages automatically use the best available protocol (iMessage → RCS → SMS).\n"}],"servers":[{"url":"https://api.linqapp.com","description":"Production server"}],"security":[{"ApiKeyAuth":[]}],"components":{"securitySchemes":{"ApiKeyAuth":{"type":"apiKey","in":"header","name":"X-LINQ-INTEGRATION-TOKEN"}}},"paths":{"/api/partner/v2/i_message_availability/check":{"post":{"tags":["Utilities"],"summary":"Check iMessage Availability","description":"Checks if a phone number is registered with iMessage.\n\n**Rate Limit:** This endpoint is limited to 1 request per 10 seconds. Exceeding this limit will result in a `429` error response.\n","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["phone_number"],"properties":{"phone_number":{"type":"string"}}}}}},"responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"object","properties":{"available":{"type":"boolean"},"phone_number":{"type":"string"}}}}}}}}}}}
```
