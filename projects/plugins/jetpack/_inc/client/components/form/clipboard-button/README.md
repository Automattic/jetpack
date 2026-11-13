Clipboard Button
================

Clipboard Button is a React component to facilitate creating a "click-to-copy" button. Under the hood, the component uses `useCopyToClipboard` from `@wordpress/compose`. The label stays the same while a temporary check or error icon shows the result, and the outcome is announced to screen readers with `speak()`, following the [Gutenberg Copy to Clipboard pattern](https://wordpress.github.io/gutenberg/?path=/docs/design-system-patterns-copy-to-clipboard--docs).

## Usage

```jsx
import ClipboardButton from 'components/form/clipboard-button';

<ClipboardButton text="Text to copy">Copy</ClipboardButton>;
```

## Props

Any prop other than the ones below is passed to the rendered `Button`.

- `text` (string): The text to copy when the button is clicked.
- `onCopy` (function): Called after the text has been copied successfully.
- `className` (string): Extra class name for the button.
- `rna` (boolean): Use the RNA button style. Default `false`.
