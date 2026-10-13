Support Info
=========

This component is used to display a support info icon. When clicked, it displays a popover with a description, a learn more link, and a privacy info link. On WordPress.com sites, pass `wpcomLink` to open the matching WordPress.com support doc in the Help Center instead.

## Example Usage:

```js
import SupportInfo from 'components/support-info';

render() {
	const support = {
		text: 'About this.',
		link: 'https://example.com/',
		privacyLink: 'https://example.com/#privacy',
	};
	return (
		<SupportInfo { ...support } />
	);
}
```

## Props

You must set either: `module`, or: `text` and `link`.

- `module` - *optional* (object) A module's info object.
- `text` - *optional* (string) A brief description of a module|feature.
- `link` - *optional* (string) A URL leading to an overview of a module|feature.
- `privacyLink` - *optional* (string) A URL leading to the privacy information for a module|feature. If empty, defaults to `[link]#privacy`.
- `wpcomLink` - *optional* (string) A `wordpress.com/support` URL for the same module|feature. On WordPress.com (Simple and Atomic) sites it replaces `link` and opens inside the Help Center instead of a new tab, and the privacy information link is not shown. Ignored on self-hosted sites.
- `wpcomPostId` - *optional* (number) The support post ID matching `wpcomLink`, passed to the Help Center so it can load the article directly.
