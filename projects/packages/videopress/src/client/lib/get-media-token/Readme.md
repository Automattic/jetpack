# getMediaToken()

Helper function that simplifies the labor when dealing with media tokens.
`playback` tokens are requested and stored locally in the client,
to reuse them in order to avoid unneeded requests.

## API

### getMediaToken

Get and return the token based on the token `scope`.

_Parameters_

-   _scope_ `upload` | `playback` | `upload-jwt`: Token scope.
-   _args_ `object`:
-   _args.id_ `?number`: Post ID, used when requesting the `playback` token.
-   _args.guid_ `?string`: Video GUID, used when requesting the `playback` token.
-   _args.adminAjaxAPI `?string`: URL of the Admin Ajax API.
-   _args.filename `?string`: Filename used when requesting `upload` token.
-   _args.flushToken `?boolean`: Pass true when flushing the tokens' store is desired.

-   `Promise`: Promise that responds to a request with the token data object.

```es6
import getMediaToken from './';

async function myPostHandler( postId, guid ) {
	const playbackTokenData = getMediaToken( 'playback', { id: postId, guid } );
	if ( playbackTokenData?.token ) {
		console.log( 'playback token: ', playbackTokenData.token );
	}
}
```

## Storing tokens layer

It uses localStorage to store and reuse `playback` tokens.
The goal is simple: reduce the requests to the server.

The first time the app requests the playback token,
the helper will perform a request to the server side to get it.

After that, it generates a unique token key and stores it in the client's localStore.
Also, it defines an expiration value that will determine the token's life cycle

The next time the app requests the token, the helper will check if the token is already stored in the localStorage.
If so, it compares the expiration time.
If it's still valid, it provides it to the app.

Otherwise, it cleans the token from the store. Requests a new one by performing a request to the server side again and defining a new expiration time.

### Force flush the token

Sometimes the token requester does want to get a fresh token.
This is possible by setting the `flushToken` argument to true.

It happens, for instance, and just FYI,
when the useVideoData() hook can't access private data
because of an authentication error.
In this case, the hook will retry the request by adding a fresh token.
