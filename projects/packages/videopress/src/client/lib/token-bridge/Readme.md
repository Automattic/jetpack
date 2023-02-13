# Token Bridge
Provide a JWT on demand.

## Handshake workflow.

The bridge won't arbitrarily send the JWT to the requester, of course.
Instead, it listens to the `videopress_token_request` event to answer the request action.

Before sending the token, it will check if it has the fundamental data to get the token, as well as information provided by the requester: source, origin, and expected event data.

The request action contains a `requestId` which will be attached to the response body together with the JWT.
Once sent, the requester will check data to validate the authenticity.

## Flush token workflow

If the bridge identifies that the client is requesting the token twice or more,
it will flush storage to get and provide a fresh token to the client.