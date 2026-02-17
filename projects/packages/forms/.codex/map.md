# Architecture Map: Jetpack Forms

<!-- verified: 2026-02-17, commit: 8225b1ff -->

## Overview

The Jetpack Forms package provides contact forms for WordPress sites using Jetpack. It handles the full lifecycle: block registration in Gutenberg, server-side rendering of form HTML, form submission processing (validation, spam detection, feedback storage as custom post type), and email notification delivery. Forms can live in posts, pages, widgets, block templates, and template parts.

## Entry Points

| Entry Point | Class::Method | File |
|-------------|---------------|------|
| Package bootstrap | `Jetpack_Forms::load_contact_form()` | `src/class-jetpack-forms.php` |
| Plugin singleton | `Contact_Form_Plugin::init()` | `src/contact-form/class-contact-form-plugin.php` |
| Block registration | `Contact_Form_Block::register_block()` | `src/blocks/contact-form/class-contact-form-block.php` |
| Form rendering | `Contact_Form::parse()` | `src/contact-form/class-contact-form.php` |
| Form submission | `Contact_Form_Plugin::process_form_submission()` | `src/contact-form/class-contact-form-plugin.php` |

## Boot Sequence

1. Host plugin calls `Jetpack_Forms::load_contact_form()`
2. This calls `Util::init()` which hooks `Contact_Form_Plugin::init` to WordPress `init` at priority 9
3. `Contact_Form_Plugin::init()` is a singleton that:
   - Registers the `feedback` custom post type and `spam`/`jp-temp-feedback` post statuses
   - Adds shortcode handler via `add_shortcode()`
   - Registers all Gutenberg blocks via `Contact_Form_Block::register_child_blocks()`
   - Hooks the POST handler: if `$_POST['action'] === 'grunion-contact-form'`, hooks `process_form_submission` to `template_redirect`
   - Sets up spam filters (blocklist + Akismet), GDPR exporters, CSV export, admin menu

## File Inventory

### Root (`src/`)
| File | Lines | Role |
|------|-------|------|
| `class-jetpack-forms.php` | 198 | Package entry point. Feature flags for dashboard, MailPoet, webhooks, integrations |

### Contact Form Core (`src/contact-form/`)
| File | Lines | Role |
|------|-------|------|
| `class-contact-form.php` | 3,477 | **Core class**. Form parsing, rendering, submission processing, JWT, email sending |
| `class-contact-form-plugin.php` | 3,953 | **Plugin singleton**. Block registration, submission routing, spam detection, CSV export, GDPR |
| `class-contact-form-field.php` | 3,339 | Field rendering (20+ field types) and validation |
| `class-feedback.php` | 1,964 | Feedback data model. Parses/stores submission data, manages `feedback` CPT |
| `class-contact-form-endpoint.php` | 1,582 | REST API endpoint for feedback CRUD operations |
| `class-feedback-field.php` | 1,021 | Individual field data model within a feedback response |
| `class-feedback-email-renderer.php` | 693 | Email HTML assembly: field compilation, template wrapping, actions |
| `class-util.php` | 486 | Template/widget hooks, scheduled cleanup, block patterns |
| `class-contact-form-shortcode.php` | 219 | Base class for shortcode parsing (parent of Contact_Form and Contact_Form_Field) |
| `class-form-preview.php` | 344 | Form preview mode for the editor |
| `class-editor-view.php` | 325 | Legacy editor view hooks (deprecated) |
| `class-feedback-source.php` | 294 | Tracks where a form submission originated (post, template, widget) |
| `class-feedback-author.php` | 209 | Author data extraction from feedback |
| `class-jetpack-form-endpoint.php` | 249 | REST endpoint for `jetpack_form` CPT (central form management) |
| `class-form-submission-error.php` | 115 | Error wrapper extending WP_Error for form submission errors |
| `trait-country-code-utils.php` | 332 | IP-to-country geolocation utilities |
| `templates/email-response.php` | ~40 | Email HTML template |

### Blocks (`src/blocks/contact-form/`)
| File | Lines | Role |
|------|-------|------|
| `class-contact-form-block.php` | ~1,040 | Block registration, render callbacks, editor asset loading, synced form rendering |

### Dashboard (`src/dashboard/`)
| File | Lines | Role |
|------|-------|------|
| `class-dashboard.php` | 366 | Admin dashboard for viewing form responses |
| `class-dashboard-view-switch.php` | 121 | Toggle between dashboard views |

### Services (`src/service/`)
| File | Lines | Role |
|------|-------|------|
| `class-form-webhooks.php` | 444 | Webhook delivery for form submissions |
| `class-mailpoet-integration.php` | 338 | MailPoet subscriber integration |
| `class-hostinger-reach-integration.php` | 255 | Hostinger Reach integration |
| `class-post-to-url.php` | 193 | POST-to-URL / Salesforce integration (legacy) |
| `class-google-drive.php` | 92 | Google Drive export |

### Form Editor (`src/form-editor/`)
| File | Lines | Role |
|------|-------|------|
| `class-form-editor.php` | 192 | Central form management editor support |

### Abilities (`src/abilities/`)
| File | Lines | Role |
|------|-------|------|
| `class-forms-abilities.php` | 387 | WordPress Abilities API integration (WP 6.9+) |

## Key Classes

```
Contact_Form_Shortcode (base)
  +-- Contact_Form          # Form-level: parsing, JWT, submission, email
  +-- Contact_Form_Field    # Field-level: rendering, validation

Contact_Form_Plugin         # Singleton orchestrator: routing, spam, GDPR, export
Contact_Form_Block          # Gutenberg block registration and render callbacks
Feedback                    # Data model for stored form responses (feedback CPT)
Feedback_Field              # Individual field within a Feedback
Feedback_Email_Renderer     # Email HTML assembly
Feedback_Source             # Where the form lives (post/template/widget)
Feedback_Author             # Author data from feedback
Form_Submission_Error       # WP_Error subclass for submission errors
Util                        # Utility hooks, patterns, scheduled tasks
```

## Data Flow

```
1. RENDERING
   Block editor saves form as jetpack/contact-form block with child field blocks
   --> WordPress renders block via Contact_Form_Block::gutenblock_render_form()
   --> Calls Contact_Form::parse() which creates Contact_Form instance
   --> Each child block renders as Contact_Form_Field via parse_contact_field()
   --> JWT token embedded in hidden field for secure submission
   --> HTML form output with interactivity API scripts

2. SUBMISSION
   User submits form (POST or AJAX)
   --> Contact_Form_Plugin::process_form_submission() handles routing
   --> JWT path: decodes JWT to reconstruct Contact_Form instance
   --> Legacy path: re-renders post content to find form by hash
   --> Contact_Form::validate() runs field-level validation
   --> Contact_Form::process_submission() orchestrates:
       a. Feedback::from_submission() creates response data model
       b. Spam check via jetpack_contact_form_is_spam filter (Akismet)
       c. Feedback::save() stores as feedback CPT
       d. Feedback_Email_Renderer::build_email_content() builds email HTML
       e. Contact_Form::wp_mail() sends notification
       f. Integrations fire (webhooks, MailPoet, etc.)
   --> Response: JSON (AJAX), redirect, or success message
```

## Available Flow Docs

| Flow | File | Description |
|------|------|-------------|
| Form Rendering | `flows/form-rendering.md` | Block render callback through HTML output with JWT embedding |
| Form Submission | `flows/form-submission.md` | POST handling, JWT decoding, validation, storage, email, response |
| Field Validation | `flows/field-validation.md` | Per-field and form-level validation during submission |
| JWT Encryption | `flows/jwt-encryption.md` | JWT encode/decode with HKDF key derivation and AES-256-GCM |
| Email Sending | `flows/email-sending.md` | Email decision tree, content assembly, and wp_mail delivery |

## Available File Notes

| File | Doc | Why it needs notes |
|------|-----|---------------------|
| `class-contact-form.php` | `files/class-contact-form.md` | Static state, JWT crypto, dual render/submit role |
| `class-contact-form-plugin.php` | `files/class-contact-form-plugin.md` | Singleton with many concerns: blocks, spam, GDPR, export |
| `class-contact-form-field.php` | `files/class-contact-form-field.md` | 20+ field type renderers with style variations |
