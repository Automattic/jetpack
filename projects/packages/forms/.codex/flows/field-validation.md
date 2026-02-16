# Field Validation

## When this happens

During form submission, after the form is reconstructed (from JWT or legacy path) and before feedback is stored.

## Entry point

`src/contact-form/class-contact-form.php:3354` -- `Contact_Form::validate()` iterates over all fields and calls per-field validation.

## Sequence

1. **Form-level validation** (`class-contact-form.php:3354`)
   - Iterates `$this->fields`, calls `$field->validate()` on each
   - Tracks if any field has a value (`$field->has_value()`)
   - If no field has any value and no errors yet, adds "Please fill out at least one field" error (line 3365)
   - Validates form reference if `ref` attribute is set (line 3368-3371)

2. **Per-field validation** (`class-contact-form-field.php:296`)
   - Skip if field already has an error (line 298)
   - Determine effective field type via `maybe_override_type()` (line 302) -- handles type overrides from block attributes
   - Skip if field is not required and has no value (line 304)
   - Skip if field type is not renderable (line 308)
   - Read field value from `$_POST[$field_id]` (line 315-323)

3. **Type-specific validation** (`class-contact-form-field.php:325-493`)
   - `url`: Regex validation against URL pattern (line 327-335)
   - `email`: WordPress `is_email()` check (line 337-341)
   - `checkbox-multiple`: At least one selection, each value must be in allowed options (line 343-377)
   - `radio`: At least one selection from allowed options (line 379-412)
   - `image-select`: Validates selected values against option letters, handles single/multiple modes (line 413-465)
   - `number`: `is_numeric()` check (line 467-472)
   - `time`: Regex `HH:MM` 24-hour format (line 474-479)
   - `file`: Non-empty array check (line 481-486)
   - `default` (text, name, telephone, date, textarea, etc.): Non-empty string after trim (line 487-492)

4. **Error propagation** (`class-contact-form-field.php:257`)
   - `$field->add_error($message)` sets error on the field
   - In `Contact_Form`: `add_error()` (line 3412) stores errors in `self::$static_errors[$id]` as `Form_Submission_Error`
   - `has_errors()` (line 3427) checks static errors for the form ID

5. **Form ref validation** (`class-contact-form.php:3379`)
   - If form has a `ref` attribute, validates that the referenced `jetpack_form` post exists and is published

## Key decisions

- **Required check first**: Non-required fields with no value skip all validation. Only presence + required is checked for most field types.
- **Option whitelisting**: For radio, checkbox-multiple, and image-select, submitted values are validated against the allowed options from form attributes. This prevents injection of arbitrary values.
- **Static error storage**: Errors are stored in `Contact_Form::$static_errors` keyed by form ID. This is because multiple forms can exist on one page, and errors need to be associated with the correct form during re-render.
- **No sanitization in validation**: Validation only checks validity. Sanitization happens separately in `Feedback::from_submission()` and `Contact_Form_Plugin::strip_tags()`.

## Files involved

| File | Role |
|------|------|
| `src/contact-form/class-contact-form.php` | `validate()` at line 3354, error storage |
| `src/contact-form/class-contact-form-field.php` | `validate()` at line 296, per-type checks |
| `src/contact-form/class-form-submission-error.php` | Error wrapper (extends WP_Error) |

## Gotchas

- **maybe_override_type()**: Field type can be overridden by block attributes (e.g., a "text" field might behave as "name" or "email"). Validation uses the effective type, not the declared type.
- **Checkbox values are arrays**: `$_POST[$field_id]` for checkbox-multiple fields is an array, not a string. The validation handles this correctly but it's easy to miss.
- **Image-select JSON**: Image-select field values are JSON-encoded strings with a `selected` key. The validator `json_decode`s them before checking against options.
- **No client-side validation gate**: Server validation runs independently of client-side validation. Even if the frontend prevents submission, the server validates everything again.
- **Static errors persist across forms**: Because errors use static storage keyed by form ID, they persist across shortcode processing. `reset_errors()` (line 3398) can clear them if needed.
