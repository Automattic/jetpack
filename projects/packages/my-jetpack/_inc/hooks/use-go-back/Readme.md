# useGoBack

Simple React custom hook that provides a handle to back links for interstitial pages

## API

```es6
const { onClickGoBack, backTo } = useGoBack( { slug } );
```

The `useGoBack()` hooks returns an object with the following properties:

### backTo
The My Jetpack tab last shown before this screen, or `fallback` when there is none.

### onClickGoBack
The handler with analytics call

```es6
import { useGoBack } from './hooks/use-go-back';

function Interstitial( slug ) {
	const { onClickGoBack, backTo } = useGoBack( { slug: 'backup' } );

	return (
		[...]
			<GoBackLink onClick={ onClickGoBack } to={ backTo } />
		[...]
	)
}
```
