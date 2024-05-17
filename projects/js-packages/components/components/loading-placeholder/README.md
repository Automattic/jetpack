LoadingPlaceholder
=========

This component is used in case we want to create a skeleton loader.

## General Usage:

```js
import { LoadingPlaceholder } from '@automattic/jetpack-components';
render() {
	return (
		<Placeholder width="60%" height={ 30 } />
	);
}
```

## Props

- `width`: an optional placeholder width
- `height`: an optional placeholder height.
- `children`: an optional react child
- `className`: an optional class name.
