# useSharePost() hook

React hook to share a post to social media connections.

## API

The hook returns an object with data and a handler to perform the publicize requests. 

-   _error_ `[Array]`: defined when something went wrong
-   _data_ `[Array]`: an object with the following fields:
-   _isFetching_ `[bool]`: True when it's performing a request. Otherwise, False.
-   _isError_ `[bool]`: True when there is something wrong. Otherwise, False.
-   _isSuccess_ `[bool]`: True when the publicize request was success. Otherwise, False.

```es6
import { useEffect } from '@wordpress/element';
import useSharePost from '../../hooks/use-share-post';

function MyComponent() {
	const { isFetching, data, error, doPublicize } = useSharePost( {
		postId: '123',
		message: 'Let\'s publish this `123` awesome post!!!',
	} );

	useEffect( () => {
		console.log( isFetching, error, data );
	}, [ isFetching, error, data ] );
	
	return (
		<Button variant="secondary" onClick={ doPublicize }>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}
```
