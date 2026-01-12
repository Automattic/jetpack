# usePostJustSaved() hook
React hook to detect when the post is just saved.
Also, it accepts a dependency array passed to useEffect hook.

```es6
import { usePostJustSaved } from '../../hooks/use-saving-post';

function SavingPostLabel() {
	usePostJustSaved( function() {
		console.log( 'The post has been saved!' );
	} );
}
```

# usePostJustPublished() hook
React hook to detect when the post is just publihsed.
Also, it accepts a dependency array passed to useEffect hook.

```es6
import { usePostJustPublished } from '../../hooks/use-saving-post';

function SavingPostLabel() {
	usePostJustPublished( function() {
		console.log( 'The post has been published!' );
	} );
}
```
