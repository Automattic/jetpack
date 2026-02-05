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

Each block has an `icon.svg` file that serves as the single source of truth for the block's icon. The SVG is consumed via webpack's `?component` suffix (e.g., `import Icon from './icon.svg?component'`), which converts the SVG into a React component at build time.

### Custom icons

Most blocks (field-checkbox, field-consent, field-date, field-image-select, field-multiple-choice, field-name, field-number, field-rating, field-select, field-single-choice, field-slider, field-text, field-textarea, field-time, fieldset-image-options, form-step, form-step-container, input-image-option, input-range) use custom SVG icons. These were originally defined as inline JSX via `renderMaterialIcon()` and have been extracted into standalone `.svg` files with JSX attributes converted to standard SVG (e.g., `fillRule` → `fill-rule`, `clipRule` → `clip-rule`).

### WordPress icons

Five blocks use icons from the `@wordpress/icons` package: field-email, field-file, field-hidden, field-telephone, and field-url. For these blocks, the `icon.jsx` continues to import from `@wordpress/icons` for use in the editor:

```js
import { Icon } from '@wordpress/components';
import { envelope } from '@wordpress/icons';

export default {
	src: <Icon icon={ envelope } />,
};
```

The `icon.svg` files for these blocks are copies of the corresponding `@wordpress/icons` SVGs, made available for any non-React consumer that needs the icon as raw SVG markup.

| Block | `@wordpress/icons` export |
|---|---|
| `field-email` | `envelope` |
| `field-file` | `upload` |
| `field-hidden` | `unseen` |
| `field-telephone` | `mobile` |
| `field-url` | `globe` |

### Regenerating a WordPress icon SVG

If a `@wordpress/icons` icon changes upstream, regenerate the SVG:

1. Check the block's `icon.jsx` to find which export it uses (see mapping table above).
2. Locate the source in `node_modules/@wordpress/icons/build/library/<name>.js`.
3. Extract the `<path>` element(s) with their attributes.
4. Convert React JSX attributes to standard SVG attributes (e.g., `fillRule` → `fill-rule`, `clipRule` → `clip-rule`).
5. Wrap in the standard SVG template:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
       <!-- path element(s) here -->
   </svg>
   ```
6. Save as `icon.svg` in the block's directory.
