# Clipboard Button Input

A read-only text field with a copy button, built from `InputControl`, `InputLayout` and `IconButton` in `@wordpress/ui`. Copying uses `useCopyToClipboard` from `@wordpress/compose`.

The button's accessible name stays "Copy". A check or error icon shows the result for two seconds, and the outcome is announced to screen readers with `speak()`, following the [Gutenberg Copy to Clipboard pattern](https://wordpress.github.io/gutenberg/?path=/docs/design-system-patterns-copy-to-clipboard--docs).

## Usage

```jsx
import ClipboardButtonInput from 'components/clipboard-button-input';

export default function MyComponent() {
	return (
		<ClipboardButtonInput label="Sitemap" value="https://example.wordpress.com/sitemap.xml" />
	);
}
```

## Props

Props not listed here are passed to the `InputControl`.

- `label` (string, required): Accessible label of the field.
- `value` (string): Text shown in the field and copied. Default `""`.
- `className` (string): Class added to the root element (`jetpack-components-clipboard-button-input`). Use it only for width and position, such as `flex-grow` or margins; do not override colors or other styles.
- `copyLabel` (string): Accessible name and tooltip of the copy button. Default "Copy".
- `disabled` (boolean): Disable the field and the button. Default `false`.
- `hideLabelFromVision` (boolean): Hide the label visually but keep it for screen readers. Default `false`.
