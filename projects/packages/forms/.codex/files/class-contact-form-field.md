# class-contact-form-field.php

<!-- verified: 2026-02-17, commit: 8225b1ff -->

`src/contact-form/class-contact-form-field.php` — ~3,339 lines

## Purpose

Handles rendering and validation of individual form fields. Supports 20+ field types (text, email, telephone, textarea, checkbox, radio, select, date, time, file upload, hidden, number, consent, image-select, rating, slider, etc.). Each field type has its own render method. Extends `Contact_Form_Shortcode`.

## Key Patterns

- **Type dispatch**: `render()` delegates to `render_field()` which switches on field type to call the appropriate type-specific renderer (e.g., `render_email_field()`, `render_radio_field()`).
- **Three style variations**: Forms support "outlined" (default), "animated" (floating labels), and "below" (label below input) styles. Each affects how labels are rendered alongside inputs. Controlled by `get_form_style()`.
- **Error integration**: Each field can have validation errors set via `add_error()`. Error divs are rendered inline via `get_error_div()` with ARIA attributes for accessibility.
- **Block attribute bridge**: Field block attributes (from Gutenberg) are converted to shortcode-style attributes by `Contact_Form_Plugin::block_attributes_to_shortcode_attributes()` before reaching this class.

## Key Methods

- **`render_field()`** — The type dispatcher. A large switch/if-else that routes to `render_email_field()`, `render_telephone_field()`, etc. To add a new field type, add a case here and a corresponding `render_*_field()` method.
- **`validate()`** — Per-field validation with type-specific rules. See `flows/field-validation.md`.
- **`get_form_style()`** — Detects the style variation by reading the parent form's `className` attribute for `is-style-*` classes. Returns "outlined", "animated", or "below". This controls which label renderer is used.
- **`maybe_override_type()`** — Field type can be overridden by block attributes. A "text" field might behave as "name" or "email". Validation and rendering both use the effective type from this method.
- **`render_telephone_field()`** — By far the most complex renderer (~175 lines). Builds an international phone input with country dropdown, flag display, and country code data attributes.
- **`get_computed_field_value()`** — Gets field value from POST with type-aware processing. Handles the differences between single-value fields, arrays (checkbox-multiple), and JSON (image-select).
- **`get_option_value()`** — For option-based fields (radio/select/checkbox), maps between display labels and submitted values. The `values` attribute can make these differ.

## Field Type → Renderer Mapping

| Type | Renderer | Notes |
|------|----------|-------|
| `text`, `name` | `render_default_field()` | Generic text input |
| `email` | `render_email_field()` | HTML5 type="email" |
| `telephone` | `render_telephone_field()` | International phone with country selector |
| `url` | `render_url_field()` | URL validation pattern |
| `textarea` | `render_textarea_field()` | Multi-line text |
| `radio` | `render_radio_field()` | Radio group in fieldset |
| `checkbox` | `render_checkbox_field()` | Single checkbox |
| `checkbox-multiple` | `render_checkbox_multiple_field()` | Multi-checkbox group |
| `select` | `render_select_field()` | Dropdown |
| `date` | `render_date_field()` | Date picker |
| `time` | `render_time_field()` | Time input (HH:MM) |
| `number` | `render_number_field()` | Numeric with min/max/step |
| `file` | `render_file_field()` | File upload with dropzone |
| `hidden` | `render_hidden_field()` | No label |
| `consent` | `render_consent_field()` | GDPR-style consent checkbox |
| `image-select` | `render_image_select_field()` | Image grid selection |
| `rating` | `render_rating_field()` | Star rating (1-5) |
| `slider` | `render_slider_field()` | Range slider |

## State

All properties inherited from `Contact_Form_Shortcode` base class:
- `$attributes` — field attributes (label, type, required, options, etc.)
- `$content` — inner content (for option children)

Access to parent form via `Contact_Form::$current_form` (static).

## Gotchas

- **Telephone field complexity**: `render_telephone_field()` is ~175 lines and builds a country dropdown with 250+ entries from `get_translatable_countries()`. If you're debugging phone field issues, start there.
- **Image-select JSON encoding**: Image select values are JSON objects with `selected` and `url` keys, not plain strings. The renderer, validator, and display logic all need to handle this format.
- **Style detection from CSS class**: `get_form_style()` reads the parent form's `className` attribute to find `is-style-*` classes. If the class isn't there, defaults to "outlined".
- **File uploads are async**: File fields use a separate AJAX endpoint for uploads via `get_unauth_endpoint_url()`. Uploaded file IDs are stored in hidden inputs, not in the main form POST.
- **Option values vs labels**: For radio/checkbox/select, the submitted value may differ from the display label if `values` attribute is set. `get_option_value()` handles the mapping.
