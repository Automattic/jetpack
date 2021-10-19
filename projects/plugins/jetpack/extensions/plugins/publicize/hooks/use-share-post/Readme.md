# useSharePost() hook

React hook to share a post to social media connections.

## API

The returned callback provides two parameters:

-   _error_ `[Array]`: defined when something went wrong
-   _result_ `[Array]`: an object with the following fields:
    -    _postId_ `[int]`: post ID of the shared post.
	-    _shared_ `[Array]`: the results of sharing the post.

```es6
function MyComponent() {
	const { onPostShareHander } = useSharePost( function( error, result ) {
		if ( error ) {
			return console.error( 'Something went wrong!!!' );
		}

		console.log( `Post ${ result.postId } has been shared!` );
	}, [] )
}
```
