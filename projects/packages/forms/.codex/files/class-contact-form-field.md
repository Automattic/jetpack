# class-contact-form-field.php

`src/contact-form/class-contact-form-field.php` -- 3,339 lines

## Purpose

Handles rendering and validation of individual form fields. Supports 20+ field types (text, email, telephone, textarea, checkbox, radio, select, date, time, file upload, hidden, number, consent, image-select, rating, slider, etc.). Each field type has its own render method that produces HTML with appropriate attributes, labels, error indicators, and style variations. Extends `Contact_Form_Shortcode`.

## Key Patterns

- **Type dispatch**: The `render()` method (line 526) delegates to `render_field()` (line 2497) which switches on field type to call the appropriate type-specific renderer.
- **Three style variations**: Forms support "outlined" (default), "animated" (floating labels), and "below" (label below input) styles. Each affects how labels are rendered alongside inputs. Controlled by `get_form_style()` (line 2738).
- **Error integration**: Each field can have validation errors set via `add_error()` (line 257). Error divs are rendered inline via `get_error_div()` (line 937) with ARIA attributes for accessibility.
- **Block attribute bridge**: Field block attributes (from Gutenberg) are converted to shortcode-style attributes by `Contact_Form_Plugin::block_attributes_to_shortcode_attributes()` before reaching this class.

## Method Index

### Core
| Method | Line | Description |
|--------|------|-------------|
| `__construct()` | 109 | Parse attributes, set field defaults (label, type, required, etc.) |
| `render()` | 526 | Main render entry point, computes field value and delegates |
| `render_field()` | 2497 | Type dispatch: routes to specific renderer based on field type |
| `validate()` | 296 | Validate field value against type rules |
| `has_value()` | 280 | Check if field has a submitted value in POST |
| `is_field_renderable()` | 2709 | Check if field type should be rendered |

### Error Handling
| Method | Line | Description |
|--------|------|-------------|
| `add_error()` | 257 | Set error message on this field |
| `is_error()` | 269 | Check if field has an error |
| `get_error_div()` | 937 | Render error HTML with ARIA attributes |
| `set_invalid_message()` | 963 | Set custom invalid message for HTML5 validation |

### Label Rendering
| Method | Line | Description |
|--------|------|-------------|
| `render_label()` | 778 | Render `<label>` for standard fields |
| `render_legend_as_label()` | 842 | Render `<legend>` styled as label (for fieldsets) |
| `render_outline_label()` | 2407 | Label for "outlined" style variation |
| `render_animated_label()` | 2443 | Floating label for "animated" style |
| `render_below_label()` | 2470 | Label below input for "below" style |

### Input Rendering
| Method | Line | Description |
|--------|------|-------------|
| `render_input_field()` | 882 | Generic `<input>` rendering with attributes |
| `render_email_field()` | 988 | Email input with validation pattern |
| `render_telephone_field()` | 1009 | Telephone with international phone input |
| `render_url_field()` | 1186 | URL input with pattern |
| `render_textarea_field()` | 1208 | `<textarea>` rendering |
| `render_radio_field()` | 1251 | Radio button group in fieldset |
| `render_checkbox_field()` | 1391 | Single checkbox |
| `render_checkbox_multiple_field()` | 1686 | Multiple checkbox group |
| `render_select_field()` | 1831 | `<select>` dropdown |
| `render_date_field()` | 1878 | Date input with calendar |
| `render_time_field()` | 1998 | Time input |
| `render_number_field()` | 2253 | Number input with min/max |
| `render_default_field()` | 2283 | Fallback generic input |
| `render_consent_field()` | 1414 | Consent checkbox (special styling) |
| `render_file_field()` | 1451 | File upload with dropzone |
| `render_hidden_field()` | 1617 | Hidden input (no label) |
| `render_image_select_field()` | 2020 | Image selection grid (single or multi) |
| `render_rating_field()` | 2773 | Star rating input |
| `render_slider_field()` | 2908 | Range slider input |

### Style & Layout
| Method | Line | Description |
|--------|------|-------------|
| `get_form_style()` | 2738 | Detect style from parent form's CSS class |
| `has_inset_label()` | 2749 | Whether style puts label inside input |
| `get_form_variation_style_properties()` | 2305 | CSS custom properties for style variations |
| `get_field_extra()` | 2658 | Extra attributes for specific field types |
| `maybe_override_type()` | 2680 | Override field type based on attributes |

### Value Computation
| Method | Line | Description |
|--------|------|-------------|
| `get_computed_field_value()` | 714 | Get field value from POST with type-aware processing |
| `get_option_value()` | 514 | Get value for option-based fields (radio/select/checkbox) |
| `sanitize_text_field()` | 501 | Sanitize + html_entity_decode |

### Asset Management
| Method | Line | Description |
|--------|------|-------------|
| `enqueue_file_field_assets()` | 1641 | Enqueue JS/CSS for file upload |
| `get_unauth_endpoint_url()` | 1664 | Get unauthenticated upload endpoint URL |
| `enqueue_slider_field_assets()` | 2993 | Enqueue slider field JS |
| `enqueue_phone_field_assets()` | 3269 | Enqueue international phone input JS/CSS |

### Data Helpers
| Method | Line | Description |
|--------|------|-------------|
| `get_translatable_countries()` | 3018 | Full country list for phone input (~250 entries) |
| `trim_image_select_options()` | 3307 | Clean up image select option data |

## Properties & State

All properties are inherited from `Contact_Form_Shortcode` base class:
- `$attributes` -- field attributes (label, type, required, options, etc.)
- `$content` -- inner content (for option children)
- `$fields` -- child fields (not used for individual fields)
- `$body` -- rendered body

The field also has access to the parent form via `Contact_Form::$current_form`.

## Key Field Types

| Type | Renderer | Notes |
|------|----------|-------|
| `text` | `render_default_field` | Generic text input |
| `name` | `render_default_field` | Same as text, different label default |
| `email` | `render_email_field` | Email validation, HTML5 type="email" |
| `telephone` | `render_telephone_field` | International phone input with country selector |
| `url` | `render_url_field` | URL validation pattern |
| `textarea` | `render_textarea_field` | Multi-line text |
| `radio` | `render_radio_field` | Radio group in fieldset/legend |
| `checkbox` | `render_checkbox_field` | Single checkbox |
| `checkbox-multiple` | `render_checkbox_multiple_field` | Multi-checkbox group |
| `select` | `render_select_field` | Dropdown select |
| `date` | `render_date_field` | Date picker |
| `time` | `render_time_field` | Time input (HH:MM) |
| `number` | `render_number_field` | Numeric input with min/max/step |
| `file` | `render_file_field` | File upload with dropzone UI |
| `hidden` | `render_hidden_field` | Hidden field, no label |
| `consent` | `render_consent_field` | Consent checkbox (GDPR-style) |
| `image-select` | `render_image_select_field` | Image grid selection |
| `rating` | `render_rating_field` | Star rating (1-5) |
| `slider` | `render_slider_field` | Range slider |

## Hooks & Filters

This class does not register hooks directly. It is called by `Contact_Form::parse_contact_field()` during shortcode processing and by block render callbacks.

## Dependencies

- **Extends**: `Contact_Form_Shortcode` (attribute/content parsing)
- **Reads from**: `Contact_Form::$current_form` (parent form reference for style detection)
- **Uses**: `Contact_Form_Plugin::strip_tags()` (option sanitization), `Jetpack_Forms` (asset URLs)

## Gotchas

- **Telephone field complexity**: The telephone renderer (line 1009) is by far the most complex at ~175 lines. It builds an international phone input with country dropdown, flag display, and country code data attributes. The country list is 250+ entries in `get_translatable_countries()` (line 3018).
- **Image-select JSON encoding**: Image select values are JSON objects with `selected` and `url` keys, not plain strings. The renderer, validator, and display logic all need to handle this.
- **Style detection from CSS class**: `get_form_style()` (line 2738) reads the parent form's `className` attribute to find `is-style-*` classes. If the class isn't there, defaults to "outlined".
- **File uploads are async**: File fields use a separate AJAX endpoint for uploads (`get_unauth_endpoint_url`). The uploaded file IDs are stored in hidden inputs, not in the main form POST.
- **Option values vs labels**: For radio/checkbox/select, the submitted value may differ from the display label if `values` attribute is set. `get_option_value()` (line 514) handles the mapping.
