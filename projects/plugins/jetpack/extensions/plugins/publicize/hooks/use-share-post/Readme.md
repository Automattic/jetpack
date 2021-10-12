# useSharePost() hook

React hook to share a post to social media connections.

## API

The hook returns a callback which provides two parameters:

- error: defined when something went wrong
- result: an object with the following fields:
  - `postId` (int): post ID of the shared post.
  - `shared` (array): the results of sharing the post.

```es6
function MyComponent() {
	const sharingPostHandler = useSharePost( error, result ) {
		if ( error ) {
			return console.error( 'Something went wrong!!!' );
		}

		console.log( `Post ${ result.postId } has been shared!` );
	}
}
```
