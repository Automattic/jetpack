# usePostJustPublished() hook
React hook to detect when the post is just published.
It accepts a dependency array passed to useEffect hook.

```es6
import usePostJustPublished from '../../hooks/use-post-just-saved';

function SavingPostLabel() {
	usePostJustPublished( function() {
		console.log( 'The post has been published!' );
	} );
}
```
