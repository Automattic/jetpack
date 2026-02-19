# Blocks for Forms

## Structure

Main container block for the form:

- `jetpack/contact-form`

This is called `contact-form` for historical reasons. Ideally the block would be called just `form`.

Blocks for multi step form variation:

- `form-progress-indicator`
- `form-step-container`
- `form-step-divider`
- `form-step-navigation`
- `form-step`

Fields:

- `field-checkbox-multiple`
- `field-consent`
- `field-date`
- `field-email`
- `field-file`
- `field-image-select`
- `field-name`
- `field-number`
- `field-option-checkbox`
- `field-option-radio`
- `field-radio`
- `field-rating`
- `field-select`
- `field-single-choice`
- `field-slider`
- `field-telephone`
- `field-text`
- `field-textarea`
- `field-time`
- `field-url`

Inner blocks meant to be used inside fields directly, or as containers of the inputs:

- `dropzone`
- `fieldset-image-options` (container) and `input-image-option`
- `input-range`
- `input-rating`
- `input`
- `label`
- `options` (container) and `option`

## Creating a new field

- Create new fields in a `field-*` folder with `index.js`, `save.js` and `edit.js` at minimum.
- Use existing `label` as inner block of the field, and `input` for basic text inputs. For more complex blocks, create a new inner block. Inputs should likely be prefixed with `input-`.
- Fields should always pull `./shared/settings` as basis for their settings; these include things like settings for syncing styles between fields.
- Block's `save()` can likely simply return `null`, i.e. no content. Don't serialize internal HTML structure of the block in posts as it's not useful fallback when the block/plugin is disabled, or in RSS and emails. Note that `defaultSettings` used in most fields already contains `save()` returning `null`.
- Don't serialize Interactivity API `data-*` props in HTML, and add them at backend render instead. Otherwise it's harder to make changes to them afterwards.
- Consider what should happen when navigating the field and inner blocks with keyboard; backspace, enter within the  field should likely create new empty line below the field ([example](https://github.com/Automattic/jetpack/pull/44781))
- Should the block support [splitting](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#splitting) on pressing Enter?
- Add `useFormWrapper()` hook so that when the field is inserted directly on page outside forms, it'll wrap itself into a form block. [See example](https://github.com/Automattic/jetpack/pull/44840).
- If the field has text-inputs, allow creating new fields in the form by pressing enter with `useInsertAfterOnEnterKeyDown( clientId )`.

## Icons

Each field block has two icon representations that must be kept in sync:

- **`icon.jsx`** (or `icon.tsx`): Defines the icon using `@wordpress/primitives` (SVG, Path, etc.) for use in React contexts (block editor, dashboard).
- **`icon.svg`**: Raw SVG file used by PHP server-side rendering and JS raw imports (`?raw`).

**Important:** If you change an icon, update both `icon.jsx` and `icon.svg`. They are maintained independently and will not automatically stay in sync.

### Custom icons

Most field blocks use custom SVG icons defined inline with `@wordpress/primitives`:

```jsx
import { SVG, Path } from '@wordpress/primitives';

const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="..." />
	</SVG>
);

export default {
	src: icon,
};
```

The corresponding `icon.svg` contains the same SVG data in standard HTML format (e.g., `fillRule` in JSX corresponds to `fill-rule` in the SVG file).

### WordPress icons

Five blocks use icons from the `@wordpress/icons` package: field-email, field-file, field-hidden, field-telephone, and field-url. For these blocks, the `icon.jsx` imports from `@wordpress/icons` directly:

```js
import { Icon } from '@wordpress/components';
import { envelope } from '@wordpress/icons';

export default {
	src: <Icon icon={ envelope } />,
};
```

The `icon.svg` files for these blocks are copies of the corresponding `@wordpress/icons` SVGs, made available for non-React consumers.

| Block | `@wordpress/icons` export |
|---|---|
| `field-email` | `envelope` |
| `field-file` | `upload` |
| `field-hidden` | `unseen` |
| `field-telephone` | `mobile` |
| `field-url` | `globe` |

### Updating an icon

1. Update the `icon.jsx` file with the new `@wordpress/primitives` JSX.
2. Update the `icon.svg` file with the equivalent raw SVG (convert JSX attributes: `fillRule` to `fill-rule`, `clipRule` to `clip-rule`, `strokeWidth` to `stroke-width`).
3. For `@wordpress/icons` blocks, if the upstream icon changes, also regenerate the `icon.svg` from the library source at `node_modules/@wordpress/icons/build/library/<name>.js`.
