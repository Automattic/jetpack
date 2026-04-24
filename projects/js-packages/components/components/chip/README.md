Chip
=========

> **Deprecated.** Use `Badge` from `@wordpress/ui` instead. Map `type="new"` to `intent="stable"` and `type="info"` to the default `intent`. This component is retained as a compatibility shim for downstream consumers and will be removed in the next major version.

This component is useful to indicate something is new.

## General Usage:

```js
import { Chip } from '@automattic/jetpack-components';
render() {
	return (
		<Chip type="new" text="New" />
	);
}
```

## Props

- `className`: an optional class name.
