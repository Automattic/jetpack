# usePostJustSaved() hook
React hook to detect when the post is just saved.

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

```es6
import { usePostJustPublished } from '../../hooks/use-saving-post';

function SavingPostLabel() {
	usePostJustPublished( function() {
		console.log( 'The post has been published!' );
	} );
}
```
