numberFormat
=========

This utility function can be used to format numbers so they are displayed in the format expected for a specific locale.

For example, a large number such as `123456` would be displayed as `123,456` in US English, and as `123 456` in FR French.

The function relies on `Intl.NumberFormat` to format the numbers, based on the locale information available in WordPress, or based on the browser locale as a fallback.

## General Usage:

```js
import { numberFormat } from '@automattic/jetpack-components';

render() {
	const number = '123456';
	const options = {
		notation: 'compact',
		compactDisplay: 'short',
	};
	return (
		<>{ numberFormat( number ) }</> // 123K
	);
}
```
