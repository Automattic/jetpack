# useSharePost() hook

React hook to share a post to social media connections.

## API

_Parameters_

-   _callback_ `[Function]`: the request callback handler.
-   _deps_ `[Array]`: hook dependencies array.

The returned callback provides two parameters:

-   _error_ `[Array]`: defined when something went wrong
-   _result_ `[Array]`: an object with the following fields:
    -    _postId_ `[int]`: post ID of the shared post.
	-    _shared_ `[Array]`: the results of sharing the post.

```es6
function MyComponent() {
	const sharingPostHandler = useSharePost( function( error, result ) {
		if ( error ) {
			return console.error( 'Something went wrong!!!' );
		}

		console.log( `Post ${ result.postId } has been shared!` );
	}, [] )
}
```
