# Field Validation

<!-- verified: 2026-02-17, commit: 8225b1ff -->

## When this happens

During form submission, after the form is reconstructed (from JWT or legacy path) and before feedback is stored.

## Entry point

`Contact_Form::validate()` (class-contact-form.php) — iterates over all fields and calls per-field validation.

## Sequence

1. **Form-level validation** — `Contact_Form::validate()`
   - Iterates `$this->fields`, calls `$field->validate()` on each
   - Tracks if any field has a value via `Contact_Form_Field::has_value()`
   - If no field has any value and no errors yet, adds "Please fill out at least one field" error
   - Validates form reference if `ref` attribute is set via `validate_ref()`

2. **Per-field validation** — `Contact_Form_Field::validate()`
   - Skip if field already has an error
   - Determine effective field type via `maybe_override_type()` — handles type overrides from block attributes
   - Skip if field is not required and has no value
   - Skip if field type is not renderable via `is_field_renderable()`
   - Read field value from `$_POST[$field_id]`

3. **Type-specific validation** — inside `Contact_Form_Field::validate()`
   - `url`: Regex validation against URL pattern
   - `email`: WordPress `is_email()` check
   - `checkbox-multiple`: At least one selection, each value must be in allowed options
   - `radio`: At least one selection from allowed options
   - `image-select`: Validates selected values against option letters, handles single/multiple modes
   - `number`: `is_numeric()` check
   - `time`: Regex `HH:MM` 24-hour format
   - `file`: Non-empty array check
   - `default` (text, name, telephone, date, textarea, etc.): Non-empty string after trim

4. **Error propagation**
   - `Contact_Form_Field::add_error($message)` sets error on the field
   - `Contact_Form::add_error()` stores errors in `self::$static_errors[$id]` as `Form_Submission_Error`
   - `Contact_Form::has_errors()` checks static errors for the form ID

5. **Form ref validation** — `Contact_Form::validate_ref()`
   - If form has a `ref` attribute, validates that the referenced `jetpack_form` post exists and is published

## Key decisions

- **Required check first**: Non-required fields with no value skip all validation. Only presence + required is checked for most field types.
- **Option whitelisting**: For radio, checkbox-multiple, and image-select, submitted values are validated against the allowed options from form attributes. This prevents injection of arbitrary values.
- **Static error storage**: Errors are stored in `Contact_Form::$static_errors` keyed by form ID. This is because multiple forms can exist on one page, and errors need to be associated with the correct form during re-render.
- **No sanitization in validation**: Validation only checks validity. Sanitization happens separately in `Feedback::from_submission()` and `Contact_Form_Plugin::strip_tags()`.

## Files involved

| File | Role |
|------|------|
| `src/contact-form/class-contact-form.php` | `validate()`, error storage |
| `src/contact-form/class-contact-form-field.php` | `validate()`, per-type checks |
| `src/contact-form/class-form-submission-error.php` | Error wrapper (extends WP_Error) |

## Gotchas

- **maybe_override_type()**: Field type can be overridden by block attributes (e.g., a "text" field might behave as "name" or "email"). Validation uses the effective type, not the declared type.
- **Checkbox values are arrays**: `$_POST[$field_id]` for checkbox-multiple fields is an array, not a string. The validation handles this correctly but it's easy to miss.
- **Image-select JSON**: Image-select field values are JSON-encoded strings with a `selected` key. The validator `json_decode`s them before checking against options.
- **No client-side validation gate**: Server validation runs independently of client-side validation. Even if the frontend prevents submission, the server validates everything again.
- **Static errors persist across forms**: Because errors use static storage keyed by form ID, they persist across shortcode processing. `Contact_Form::reset_errors()` can clear them if needed.
