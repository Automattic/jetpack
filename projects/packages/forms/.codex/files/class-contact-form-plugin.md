# class-contact-form-plugin.php

<!-- verified: 2026-02-17, commit: 8225b1ff -->

`src/contact-form/class-contact-form-plugin.php` — ~3,953 lines

## Purpose

The plugin singleton that orchestrates everything. Registers blocks, shortcodes, post types, and post statuses. Routes form submissions to the correct form. Handles spam detection (blocklist + Akismet), GDPR data export/erasure, CSV export, admin menu, and analytics. If `Contact_Form` is the engine, `Contact_Form_Plugin` is the chassis.

## Key Patterns

- **Singleton**: `init()` creates a single instance. All hook registration happens in `__construct()`. Most static methods can be called without the instance.
- **Block-to-shortcode bridge**: Block render callbacks (e.g., `gutenblock_render_field_text()`) convert block attributes to shortcode attributes via `block_attributes_to_shortcode_attributes()`, then call `Contact_Form::parse_contact_field()`. This keeps one rendering pipeline for both blocks and shortcodes.
- **POST routing in constructor**: The constructor checks if the current request is a form submission (`$_POST['action'] === 'grunion-contact-form'`) and hooks `process_form_submission` to `template_redirect`. This happens on every page load where the POST condition matches.
- **Feature flags**: `has_editor_feature_flag()` checks `jetpack_block_editor_feature_flags` filter for features like `central-form-management`.

## Key Methods

- **`block_attributes_to_shortcode_attributes()`** — The critical bridge method (~270 lines). Converts Gutenberg block attributes to shortcode-style attributes. Understanding this is essential when debugging why a block attribute isn't reaching the renderer.
- **`process_form_submission()`** — The main submission router. Determines JWT vs legacy path, reconstructs the form, validates, initializes integrations, then delegates to `Contact_Form::process_submission()`. See `flows/form-submission.md`.
- **`get_block_support_classes_and_styles()`** — Generates CSS from block supports (color, typography, border, spacing). Called by block render callbacks. The output feeds into the form's HTML wrapper.
- **`prepare_for_akismet()`** — Formats form submission data into the structure Akismet expects. Important because the field mapping isn't obvious (e.g., `comment_author` comes from the form's name field, not a WordPress user).
- **`is_spam_akismet()`** — Sends prepared data to Akismet API. Returns `true` (spam), `false` (ham), or passes through. Only runs if Akismet plugin is active.
- **`parse_feedback_content()`** — Parses legacy feedback post content (which uses a custom format with `AUTHOR:`, `AUTHOR EMAIL:`, etc. markers). This is the other parsing format alongside JSON data.
- **`reverse_that_print()`** — Reverses `print_r()` output back to array. Yes, really. Used for parsing legacy stored feedback where arrays were stored via `print_r()`.
- **`esc_csv()`** — CSV field escaping that prevents formula injection (strips leading `=`, `+`, `-`, `@` characters). Security-relevant.

## State

Minimal instance state — mostly the singleton pattern:
- `$using_contact_form_field` (static) — Flag for when currently processing a `contact-field` shortcode
- `$current_widget_id` (instance) — Widget ID being rendered, for form source tracking

## Hooks Registered in Constructor

The constructor registers ~30 hooks. Key ones:
- `jetpack_contact_form_is_spam` → `is_spam_blocklist()`, `is_spam_akismet()`
- `wp_ajax_grunion-contact-form` / `nopriv` → `ajax_request()`
- `wp_privacy_personal_data_exporters` / `erasers` → GDPR handlers
- `wp_ajax_feedback_export` → `download_feedback_as_csv()`
- `template_redirect` → `process_form_submission()` (conditional on POST data)
- Registers `feedback` CPT and `spam`/`jp-temp-feedback` post statuses

## Concern Areas

This file has many responsibilities. When searching, know which area you need:

| Area | Key Methods | What it does |
|------|-------------|--------------|
| Block rendering | `gutenblock_render_field_*()`, `block_attributes_to_shortcode_attributes()` | 20+ render callbacks, attribute conversion |
| Submission routing | `process_form_submission()`, `ajax_request()` | JWT vs legacy path, form reconstruction |
| Spam detection | `is_spam_blocklist()`, `is_spam_akismet()`, `prepare_for_akismet()` | Blocklist + Akismet integration |
| CSV export | `download_feedback_as_csv()`, `get_export_data_for_posts()`, `esc_csv()` | Feedback data export |
| GDPR | `personal_data_exporter()`, `personal_data_eraser()` | WP privacy API integration |
| Admin/Dashboard | `admin_menu()`, `unread_count()` | Menu, unread badges |
| Widget support | `track_current_widget()`, `widget_atts()` | Widget context tracking |

## Gotchas

- **Block render callbacks are boilerplate**: The 20+ `gutenblock_render_field_*()` methods are nearly identical — each calls `block_attributes_to_shortcode_attributes()` with a field type, then `Contact_Form::parse_contact_field()`. The interesting logic is in `block_attributes_to_shortcode_attributes()`.
- **Constructor does POST detection**: The constructor itself checks for form submissions and hooks the handler. This means the submission routing code runs on plugin instantiation, not lazily.
- **Two feedback parsing formats**: Legacy content uses markers (`AUTHOR:`, `AUTHOR EMAIL:`, etc.) parsed by `parse_feedback_content()`. Modern uses JSON in `_feedback_json_data` post meta. Methods like `get_post_content_for_csv_export()` handle both.
