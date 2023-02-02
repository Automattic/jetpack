# Token Bridge
Provide a JWT on demand.

## Handshake workflow.

The bridge won't send arbitrarily the JWT to the requester. Instead, it listens to the `videopress_token_request` event to answer the request action.

The request action contains a `requestId` which will be attached to the response body together with the JWT. Once sends, the requester will check these data to validate the authenticity.
