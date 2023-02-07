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