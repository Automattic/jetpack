# useGoBack

Simple React custom hook that provides a handle to back links for interstitial pages

## API

```es6
const { onClickGoBack } = useGoBack( { slug } );
```

The `useGoBack()` hooks returns an object with the following properties:

### onClickGoBack
The handler with analytics call

```es6
import { useGoBack } from './hooks/use-go-back';

function Interstitial( slug ) {
	const { onClickGoBack } = useGoBack( { slug: 'backup' } );

	return (
		[...]
			<GoBackLink onClick={ onClickGoBack } />
		[...]
	)
}
```
