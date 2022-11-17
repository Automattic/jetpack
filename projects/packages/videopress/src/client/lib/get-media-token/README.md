# getMediaToken( <scope>, <args> )

Returns a Promise that can be used to get a valid token to access admin actions when the media is private.

The `scope` terminates the action level: `upload`, `playback`.

```es6
// Getting a token to upload data
const { token } = await getMediaToken( 'upload' );

// Getting a token to access to read data (playback)
const { token } = await getMediaToken( 'playback', { id, guid } );
```