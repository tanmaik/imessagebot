# Getting Started

All API requests use `https://api.linqapp.com` as the base URL and require authentication via the `X-LINQ-INTEGRATION-TOKEN` header. Your integration token determines which phone numbers you can message from and which organization data you can access.

```bash
curl https://api.linqapp.com/api/partner/v2/chats \
  -H "X-LINQ-INTEGRATION-TOKEN: your_token_here"
```
