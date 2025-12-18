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
