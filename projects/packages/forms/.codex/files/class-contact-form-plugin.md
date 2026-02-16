# class-contact-form-plugin.php

`src/contact-form/class-contact-form-plugin.php` -- 3,953 lines

## Purpose

The plugin singleton that orchestrates everything. Registers blocks, shortcodes, post types, and post statuses. Routes form submissions to the correct form. Handles spam detection (blocklist + Akismet), GDPR data export/erasure, CSV export, admin menu, and tracks/analytics. If `Contact_Form` is the engine, `Contact_Form_Plugin` is the chassis.

## Key Patterns

- **Singleton**: `init()` (line 116) creates a single instance. All hook registration happens in `__construct()` (line 199). Most static methods can be called without the instance.
- **Block-to-shortcode bridge**: Block render callbacks (e.g., `gutenblock_render_field_text`) convert block attributes to shortcode attributes via `block_attributes_to_shortcode_attributes()`, then call `Contact_Form::parse_contact_field()`. This keeps one rendering pipeline for both blocks and shortcodes.
- **POST routing in constructor**: The constructor checks if the current request is a form submission (`$_POST['action'] === 'grunion-contact-form'`) and hooks `process_form_submission` to `template_redirect` (line 330-338). This happens on every page load where the POST condition matches.
- **Feature flags**: `has_editor_feature_flag()` (line 400) checks `jetpack_block_editor_feature_flags` filter for features like `central-form-management`.

## Method Index

### Initialization & Setup
| Method | Line | Description |
|--------|------|-------------|
| `init()` | 116 | Singleton factory. Creates instance, hooks cleanup |
| `__construct()` | 199 | Registers everything: post types, blocks, spam filters, GDPR, admin |
| `register_contact_form_blocks()` | 432 | Delegates to `Contact_Form_Block::register_child_blocks()` |
| `has_editor_feature_flag()` | 400 | Check if a feature flag is enabled |
| `add_shortcode()` | 2007 | Register `contact-form` and `contact-field` shortcodes |
| `reset_step()` | 840 | Reset multi-step form counter |

### Block Rendering (bridge to shortcode system)
| Method | Line | Description |
|--------|------|-------------|
| `block_attributes_to_shortcode_attributes()` | 547 | Convert block attrs to shortcode attrs (huge method, ~270 lines) |
| `get_block_support_classes_and_styles()` | 447 | Generate CSS from block supports (color, typography, border, spacing) |
| `get_block_style_classes()` | 509 | Extract style variation classes |
| `get_style_variation_shortcode_attributes()` | 1106 | Get style-specific shortcode attributes |
| `gutenblock_render_field_text()` | 1148 | Render text field block |
| `gutenblock_render_field_name()` | 1162 | Render name field block |
| `gutenblock_render_field_email()` | 1176 | Render email field block |
| `gutenblock_render_field_url()` | 1190 | Render URL field block |
| `gutenblock_render_field_date()` | 1204 | Render date field block |
| `gutenblock_render_field_telephone()` | 1218 | Render telephone field block |
| `gutenblock_render_field_textarea()` | 1234 | Render textarea field block |
| `gutenblock_render_field_checkbox()` | 1248 | Render checkbox field block |
| `gutenblock_render_field_checkbox_multiple()` | 1262 | Render multi-checkbox field block |
| `gutenblock_render_field_option()` | 1275 | Render option (for radio/select) |
| `gutenblock_render_field_radio()` | 1289 | Render radio field block |
| `gutenblock_render_field_select()` | 1303 | Render select field block |
| `gutenblock_render_field_consent()` | 1315 | Render consent field block |
| `gutenblock_render_field_file()` | 1338 | Render file upload field block |
| `gutenblock_render_dropzone()` | 1358 | Render dropzone UI |
| `gutenblock_render_field_hidden()` | 1385 | Render hidden field block |
| `gutenblock_render_field_number()` | 1401 | Render number field block |
| `gutenblock_render_field_time()` | 1415 | Render time field block |
| `gutenblock_render_field_image_select()` | 1429 | Render image select field block |
| `gutenblock_render_field_rating()` | 3805 | Render rating field block |
| `gutenblock_render_field_slider()` | 3819 | Render slider field block |
| `gutenblock_render_form_step()` | 852 | Render multi-step form step |
| `gutenblock_render_form_step_navigation()` | 909 | Render step navigation buttons |
| `gutenblock_render_form_progress_indicator()` | 996 | Render step progress indicator |
| `get_image_option_letter()` | 821 | Get letter label for image-select option |

### Submission Handling
| Method | Line | Description |
|--------|------|-------------|
| `process_form_submission()` | 1571 | **Main submission router**. JWT path or legacy path, then delegates to form |
| `ajax_request()` | 1883 | AJAX handler, wraps `process_form_submission()` |
| `validate_parent_post()` | 1962 | Ensure form's parent post exists and isn't trashed |

### Spam Detection
| Method | Line | Description |
|--------|------|-------------|
| `is_spam_blocklist()` | 2195 | Check WordPress blocklist (wp_check_comment_disallowed_list) |
| `is_in_disallowed_list()` | 2211 | Check comment disallowed list |
| `prepare_for_akismet()` | 2240 | Format form data for Akismet API |
| `is_spam_akismet()` | 2285 | Send to Akismet for spam check |
| `akismet_submit()` | 2342 | Submit ham/spam to Akismet for training |

### Admin & Dashboard
| Method | Line | Description |
|--------|------|-------------|
| `admin_menu()` | 1443 | Register admin menu pages |
| `unread_count()` | 1497 | Calculate and display unread count in menu |
| `get_unread_count()` | 1549 | Get cached unread count |
| `recalculate_unread_count()` | 1560 | Recalculate and cache unread count |
| `redirect_edit_feedback_to_jetpack_forms()` | 3841 | Redirect old feedback edit to new dashboard |
| `parse_menu_item()` | 3741 | Parse menu item for unread badge |

### CSV Export
| Method | Line | Description |
|--------|------|-------------|
| `download_feedback_as_csv()` | 3061 | Handle CSV download AJAX request |
| `get_export_data_for_posts()` | 2964 | Get export data for post IDs |
| `get_export_feedback_data()` | 2874 | Get feedback data for export |
| `format_feedback_data_for_csv()` | 2911 | Format data for CSV output |
| `get_post_content_for_csv_export()` | 2386 | Parse post content for CSV |
| `get_post_meta_for_csv_export()` | 2401 | Parse post meta for CSV |
| `get_feedback_entries_from_post()` | 2996 | Get feedback from current request |
| `get_well_known_column_names()` | 2980 | Standard column names for export |
| `get_field_names()` | 3323 | Extract field names from posts |
| `has_json_data()` | 3347 | Check if feedback has JSON data format |
| `esc_csv()` | 3256 | Escape field for CSV (prevent formula injection) |
| `get_all_parent_post_ids()` | 3274 | Get all post IDs that have feedback |
| `get_feedbacks_as_options()` | 3294 | Get feedbacks for dropdown |
| `form_posts_dropdown()` | 2368 | Render form posts dropdown HTML |
| `make_csv_row_from_feedback()` | 3459 | Build single CSV row |

### Google Drive Export
| Method | Line | Description |
|--------|------|-------------|
| `validate_export_to_gdrive_request()` | 3866 | Validate Google Drive export request |
| `export_to_gdrive()` | 3889 | Handle Google Drive export |
| `create_new_form()` | 3139 | Create new form post (AJAX) |

### GDPR
| Method | Line | Description |
|--------|------|-------------|
| `register_personal_data_exporter()` | 2521 | Register WP personal data exporter |
| `register_personal_data_eraser()` | 2539 | Register WP personal data eraser |
| `personal_data_exporter()` | 2558 | Export personal data (public entry) |
| `internal_personal_data_exporter()` | 2577 | Export personal data (paginated) |
| `internal_personal_data_formater()` | 2593 | Format personal data for export |
| `personal_data_eraser()` | 2660 | Erase personal data (public entry) |
| `_internal_personal_data_eraser()` | 2679 | Erase personal data (paginated) |
| `personal_data_post_ids_by_email()` | 2757 | Find feedback posts by email |
| `set_pde_email_address()` | 2795 | Set email for personal data search |
| `personal_data_search_filter()` | 2808 | Custom search filter for feedback |

### Widget Support
| Method | Line | Description |
|--------|------|-------------|
| `track_current_widget()` | 2106 | Track which widget is being rendered |
| `track_current_widget_before()` | 2118 | Before widget render hook |
| `track_current_widget_after()` | 2125 | After widget render hook |
| `get_current_widget_context()` | 2135 | Get current widget ID context |
| `widget_atts()` | 2152 | Add widget context to form attributes |
| `widget_shortcode_hack()` | 2166 | Process shortcodes in old text widgets |

### Utilities
| Method | Line | Description |
|--------|------|-------------|
| `strip_tags()` | 173 | Strip HTML tags (recursive, uses wp_kses_post) |
| `tokenize_label()` | 2023 | Tokenize field label for matching |
| `sanitize_value()` | 2033 | Sanitize a field value |
| `format_value_for_display()` | 2052 | Format value for display (handles files, arrays) |
| `replace_tokens_with_input()` | 2081 | Replace `{field_label}` tokens in subject line |
| `insert_feedback_filter()` | 1995 | Force post author to 0 for feedback CPT |
| `allow_feedback_rest_api_type()` | 1487 | Add feedback to REST allowed types |
| `remove_from_related_posts_allowed_post_types()` | 412 | Exclude feedback from related posts |
| `disable_forms_view_script_concat()` | 422 | Prevent script concatenation for view.js |
| `use_block_editor_for_post_type()` | 3507 | Disable block editor for feedback CPT |
| `restrict_feedback_comments_to_logged_in()` | 3522 | Require login for feedback comments |
| `parse_feedback_content()` | 3366 | Parse legacy feedback post content |
| `parse_fields_from_content()` | 3439 | Parse fields from feedback content |
| `reverse_that_print()` | 3546 | Reverse print_r() output back to array |
| `get_ip_address()` | 3496 | Get client IP from headers |
| `can_use_analytics()` | 3721 | Check if Tracks analytics available |

### Status Tracking
| Method | Line | Description |
|--------|------|-------------|
| `daily_akismet_meta_cleanup()` | 132 | Cron: delete old Akismet meta (15 days) |
| `record_tracks_event()` | 3203 | Record analytics event |
| `track_spam_status_change()` | 3638 | Track spam status transitions |
| `track_feedback_status_change()` | 3662 | Track feedback status transitions |
| `track_spam_status()` | 3684 | Submit ham/spam to Akismet |
| `track_recount_unread()` | 3702 | Recalculate unread on status change |
| `untrash_feedback_status_handler()` | 3617 | Restore correct status when untrashing |

## Properties & State

| Property | Scope | Type | Description |
|----------|-------|------|-------------|
| `$using_contact_form_field` | static | bool | Flag: currently processing contact-field shortcode |
| `$current_widget_id` | instance | string | Widget ID being rendered |
| *singleton instance* | static (in `init()`) | self | The single plugin instance |

## Hooks Registered in Constructor

The constructor (line 199) registers ~30 hooks. Key ones:

- `dynamic_sidebar` → `track_current_widget` (widget context tracking)
- `jetpack_contact_form_is_spam` → `is_spam_blocklist` (priority 10), `is_spam_akismet` (priority 10)
- `jetpack_contact_form_in_comment_disallowed_list` → `is_in_disallowed_list`
- `loop_start` → `Contact_Form::style_on` (enable CSS)
- `wp_ajax_grunion-contact-form` / `wp_ajax_nopriv_grunion-contact-form` → `ajax_request`
- `wp_privacy_personal_data_exporters` / `erasers` → GDPR handlers
- `wp_ajax_feedback_export` → `download_feedback_as_csv`
- `template_redirect` → `process_form_submission` (conditional on POST data)
- Registers `feedback` CPT and `spam`/`jp-temp-feedback` post statuses

## Dependencies

- **Uses**: `Contact_Form` (form instances), `Contact_Form_Field` (field rendering), `Contact_Form_Block` (block registration), `Feedback` (data model), `Feedback_Source`, `Form_Submission_Error`, `Util`, `Form_Webhooks`, `MailPoet_Integration`, `Hostinger_Reach_Integration`, `Post_To_Url`, `Form_Editor`, `Form_Preview`
- **External**: `Automattic\Jetpack\Forms\Jetpack_Forms` (feature flags), `Akismet` (spam detection), `Jetpack_Tracks_Event` (analytics)
