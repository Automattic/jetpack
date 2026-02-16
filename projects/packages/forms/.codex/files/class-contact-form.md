# class-contact-form.php

`src/contact-form/class-contact-form.php` -- 3,477 lines

## Purpose

The core form class. Handles two major responsibilities: (1) rendering form HTML during page display (via `parse()`), and (2) processing form submissions (via `process_submission()`). Also owns JWT encoding/decoding, email sending, success messages, and file uploads. Extends `Contact_Form_Shortcode` for attribute/content parsing.

## Key Patterns

- **Static shared state**: Multiple forms on a page interact through static properties (`$last`, `$current_form`, `$forms`, `$static_errors`, `$style`). Forms are indexed by hash in `$forms` for retrieval during submission.
- **Dual role**: Same class handles both rendering (shortcode callback) and submission processing. The `parse()` method is called during rendering; `process_submission()` during POST handling.
- **Error storage is static**: Errors live in `self::$static_errors[$form_id]`, not on the instance. This allows errors to persist across form re-renders (e.g., when re-rendering a page after validation failure).
- **JWT for stateless submission**: Form attributes are encrypted into a JWT token embedded as a hidden field. On submission, the JWT reconstructs the form without re-rendering the page.

## Method Index

### Construction & Identity
| Method | Line | Description |
|--------|------|-------------|
| `__construct()` | 215 | Parse content, compute hash, set defaults, build default form if empty |
| `compute_id()` | 635 | Generate form ID from attributes + post context |
| `get_attributes()` | 721 | Return form attributes array |
| `get_attribute()` | *inherited* | Get single attribute (from Contact_Form_Shortcode) |

### Reference Management (Synced Forms)
| Method | Line | Description |
|--------|------|-------------|
| `set_ref_id()` | 166 | Set the jetpack_form post ID reference |
| `clear_ref_id()` | 176 | Clear the reference ID |
| `get_ref_id()` | 186 | Get current reference ID |
| `has_seen()` | 196 | Check if ref ID already processed (circular ref prevention) |
| `reset_seen_refs()` | 203 | Clear all seen references |
| `register_post_type()` | 536 | Register `jetpack_form` CPT for central form management |
| `get_forms_count()` | 622 | Count registered jetpack_form posts |

### JWT & Encryption
| Method | Line | Description |
|--------|------|-------------|
| `get_jwt()` | 731 | Encode form into JWT with AES-256-GCM encryption |
| `get_instance_from_jwt()` | 345 | Decode JWT, decrypt attributes, reconstruct form |
| `get_secret()` | 657 | Resolve signing secret (filter → connection token → option → generate) |

### Rendering
| Method | Line | Description |
|--------|------|-------------|
| `parse()` | 1050 | **Main render method**. Creates form, enqueues assets, builds HTML |
| `parse_contact_field()` | 2138 | Parse a `[contact-field]` shortcode into Contact_Form_Field |
| `style()` / `style_on()` | 996/1009 | Control CSS enqueuing |
| `prepare_submit_button()` | 1411 | Process submit button HTML |
| `render_error_wrapper()` | 1617 | HTML wrapper for validation errors |
| `render_ajax_success_wrapper()` | 1642 | HTML wrapper for AJAX success response |
| `render_noscript_success_message()` | 1440 | Fallback success for non-JS submissions |
| `success_message()` | 1847 | Generate success message HTML |
| `get_compiled_form()` | 1894 | Get compiled form data for success display |
| `get_json_data()` | 1937 | Get form data as JSON for AJAX response |
| `get_compiled_form_for_email()` | 1984 | Get compiled form for email rendering |
| `get_block_container_classes()` | 3056 | Compute CSS classes from block attributes |
| `get_block_alignment_class()` | 3081 | Get alignment CSS class |
| `add_theme_json_data_for_classic_themes()` | 3276 | Ensure block supports work in classic themes |
| `add_quick_link_to_admin_bar()` | 1017 | Add "Form Responses" link to admin bar |
| `store_shortcode()` | 985 | Store shortcode in post meta for legacy submission |

### Submission Processing
| Method | Line | Description |
|--------|------|-------------|
| `process_submission()` | 2426 | **Main submission handler**. Spam check, store, email, respond |
| `get_field_ids()` | 2356 | Get field IDs for the form |
| `process_file_upload_field()` | 3100 | Handle file field uploads |
| `wp_mail()` | 2957 | Wrapper around WordPress wp_mail() with HTML content type |
| `add_name_to_address()` | 2971 | Add display name to email address |
| `get_mail_content_type()` | 2993 | Return 'text/html' for email |
| `wrap_message_in_html_tags()` | 3011 | Wrap email content in HTML template |
| `add_plain_text_alternative()` | 3023 | Add plain text alt body via PHPMailer hook |
| `has_custom_redirect()` | 2862 | Check if form uses redirect confirmation |
| `get_redirect_url()` | 2889 | Build redirect URL after submission |

### Validation & Errors
| Method | Line | Description |
|--------|------|-------------|
| `validate()` | 3354 | Run field validation and form-level checks |
| `validate_ref()` | 3379 | Validate synced form reference exists and is published |
| `add_error()` | 3412 | Add error to static error storage |
| `has_errors()` | 3427 | Check if form has validation errors |
| `get_error_messages()` | 3440 | Get all error messages |
| `reset_errors()` | 3398 | Clear static errors for form or all forms |
| `get_confirmation_type()` | 3453 | Get confirmation type (text/redirect) with backward compat |
| `get_disable_summary()` | 3467 | Get summary display setting with backward compat |

### Data Helpers
| Method | Line | Description |
|--------|------|-------------|
| `get_default_to()` | 857 | Resolve default email recipients |
| `get_default_to_for_editor()` | 891 | Resolve recipients for block editor display |
| `get_default_subject()` | 950 | Build default email subject |
| `get_post_property()` | 928 | Safely get post property (handles null) |
| `get_permalink()` | 2937 | Get permalink with page number support |
| `get_source()` | 825 | Get feedback source context |
| `set_source()` | 489 | Set feedback source |
| `get_context()` | 501 | Get form context string |
| `increment_form_context_count()` | 524 | Track forms per context |
| `get_forms_context_count()` | 840 | Get form count for a context |
| `escape_and_sanitize_field_value()` | 1996 | Sanitize field values for display |
| `escape_and_sanitize_field_label()` | 3262 | Sanitize field labels |
| `esc_shortcode_val()` | 2101 | Escape values for shortcode attributes |
| `addslashes_deep()` | 3033 | Deep addslashes for arrays |
| `is_file_upload_field()` | 2245 | Check if field is file upload type |
| `get_file_upload_fields()` | 2061 | Get file upload fields for a feedback post |
| `delete_feedback_files()` | 2081 | Delete attached files when feedback is deleted |
| `get_default_label_from_type()` | 2260 | Map field type to default label |
| `remove_empty()` | 2051 | Filter callback to remove empty values |
| `format_submission_data()` | 1493 | Format submitted data for display |
| `get_url()` | 1525 | Extract URL from field value |
| `get_rating()` | 1548 | Extract rating from field value |
| `get_field_type_icon()` | 1577 | Get icon for field type in display |
| `get_images()` | 3199 | Extract image data from field value |
| `get_files()` | 3230 | Extract file data from field value |
| `maybe_transform_value()` | 3148 | Transform special field values for display |

## Properties & State

### Static (shared across all form instances)
| Property | Type | Description |
|----------|------|-------------|
| `$last` | `Contact_Form\|null` | Most recently rendered form |
| `$current_form` | `Contact_Form\|null` | Form currently being processed |
| `$forms` | `array` | All forms indexed by hash (for submission lookup) |
| `$forms_context` | `array` | Form count per context |
| `$static_errors` | `array` | Errors keyed by form ID (WP_Error instances) |
| `$style` | `bool` | Whether to enqueue CSS |
| `$allowed_html_tags_for_submit_button` | `array` | Allowed HTML in submit button |
| `$ref_id` | `int\|null` | Current synced form reference ID |
| `$seen_ref` | `array` | Seen reference IDs for circular ref prevention |

### Instance
| Property | Type | Description |
|----------|------|-------------|
| `$errors` | `WP_Error` | This form's validation errors |
| `$hash` | `string` | SHA1 of attributes JSON |
| `$current_post` | `WP_Post\|null` | The post containing this form |
| `$has_verified_jwt` | `bool` | True if form was reconstructed from valid JWT |
| `$source` | `Feedback_Source` | Where this form lives |
| `$is_response_without_reload_enabled` | `bool` | AJAX submission enabled |
| `$shortcode_name` | `string` | Always `'contact-form'` |

## Hooks & Filters

### Filters applied (consumed)
| Filter | Line | Purpose |
|--------|------|---------|
| `jetpack_forms_enable_ajax_submission` | 228 | Toggle AJAX submission |
| `jetpack_forms_secret_jwt` | 666 | Override JWT signing secret |
| `jetpack_forms_jwt_decode_failure` | 370/384 | Handle JWT decode failure |
| `contact_form_to` | 2555 | Override email recipients |
| `contact_form_subject` | 2619 | Override email subject |
| `jetpack_contact_form_is_spam` | 2522 | Spam detection chain |
| `jetpack_contact_form_in_comment_disallowed_list` | 2539 | Disallowed list check |
| `jetpack_contact_form_email_headers` | 2606 | Customize email headers |
| `jetpack_contact_form_forget_ip_address` | 2684 | Strip IP from stored feedback |
| `grunion_should_send_email` | 2751 | Override email sending decision |
| `grunion_still_email_spam` | 2770 | Email spam submissions |

### Actions fired
| Action | Line | Purpose |
|--------|------|---------|
| `grunion_after_feedback_post_inserted` | 2719 | After feedback CPT saved |
| `grunion_pre_message_sent` | 2788 | Before email sent |
| `grunion_after_message_sent` | 2818 | After email sent |

## Dependencies

- **Extends**: `Contact_Form_Shortcode` (attribute parsing, content processing)
- **Uses**: `Contact_Form_Plugin` (singleton, for plugin context), `Contact_Form_Field` (field rendering), `Feedback` (response data model), `Feedback_Source` (source tracking), `Feedback_Email_Renderer` (email assembly), `Form_Submission_Error` (error wrapping)
- **External**: `Automattic\Jetpack\JWT` (token signing), `Automattic\Jetpack\Connection\Tokens` (secret retrieval), `Automattic\Jetpack\Sync\Settings` (sync check)
