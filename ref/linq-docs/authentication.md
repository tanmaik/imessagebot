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
