shortNumberFormat
=========

This utility function can be used to format numbers so they are displayed in a short format expected for a specific 
locale.

For example, a large number such as `12345` would be displayed as `12.3 K` in US English, and as `12,3 k` in FR French.

The function relies on `Intl.NumberFormat` to format the numbers, based on the locale information available in 
WordPress, or based on the browser locale as a fallback

## General Usage:

```js
import { shortNumberFormat } from '@automattic/jetpack-components';

render() {
	const number = '123456';
	return (
		<>{ shortNumberFormat( number ) } </>
	);
}
```
