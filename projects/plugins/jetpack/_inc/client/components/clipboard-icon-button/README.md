# Clipboard Icon Button

An `IconButton` from `@wordpress/ui` that copies text with `useCopyToClipboard` from `@wordpress/compose`.

The accessible name stays the same. A check or error icon shows the result for two seconds, and the outcome is announced to screen readers with `speak()`, following the [Gutenberg Copy to Clipboard pattern](https://wordpress.github.io/gutenberg/?path=/docs/design-system-patterns-copy-to-clipboard--docs).

## Usage

```jsx
import ClipboardIconButton from 'components/clipboard-icon-button';

<ClipboardIconButton text="https://example.wordpress.com/" />;
```

In a text field, put it in the field's suffix:

```jsx
<InputControl
	label="Sitemap"
	value={ url }
	readOnly
	suffix={
		<InputLayout.Slot padding="minimal">
			<ClipboardIconButton text={ url } size="small" />
		</InputLayout.Slot>
	}
/>
```

## Props

Props not listed here are passed to `IconButton`.

- `text` (string): Text to copy.
- `label` (string): Accessible name and tooltip. Default "Copy".
- `icon` (icon): Icon shown before copying. Default `copy`.
