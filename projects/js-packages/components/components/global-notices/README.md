GlobalNotices
=========

> **Deprecated.** Use `SnackbarNotices` from `@wordpress/notices` instead, and
> dispatch to that store directly with `{ type: 'snackbar' }`. Pages rendered by
> `@wordpress/boot` already mount a `SnackbarNotices`, so mounting this one too
> shows every notice twice. Retained as a compatibility shim for downstream
> consumers and will be removed in the next major version.

Renders the snackbar notices held in the `@wordpress/notices` store.

## General Usage:

```js
import { GlobalNotices } from '@automattic/jetpack-components';
render() {
	return (
		<GlobalNotices />
	);
}
```

## Props

- `maxVisibleNotices`: how many notices to show at once. Defaults to 3.
