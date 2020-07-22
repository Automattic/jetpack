Create Interpolate Element
=========

This function creates an interpolated element from a passed in string with specific tags matching how the string should be converted to an element via the conversion map value.

`createInterpolateElement` is available in WordPress 5.5 and in latest versions of the Gutenberg plugin, but it is not available in WordPress 5.4, which we still support.

## Example Usage:

```js
import Gridicon from 'components/gridicon';
import { __ } from '@wordpress/i18n';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
const getDocumentationLink = () => {
	return jetpackjetpackCreateInterpolateElement(lement(
		__( '<FlagIcon /> Still confused? <a>Check out documentation for more!</a>', 'jetpack' ),
		{
			FlagIcon: <Gridicon icon="flag" size={ 64 } />
			a: <a href="https://jetpack.com" />,
		}
	);
};
```
