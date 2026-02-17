# class-contact-form.php

<!-- verified: 2026-02-17, commit: 8225b1ff -->

`src/contact-form/class-contact-form.php` — ~3,477 lines

## Purpose

The core form class. Handles two major responsibilities: (1) rendering form HTML during page display (via `parse()`), and (2) processing form submissions (via `process_submission()`). Also owns JWT encoding/decoding, email sending, success messages, and file uploads. Extends `Contact_Form_Shortcode`.

## Key Patterns

- **Static shared state**: Multiple forms on a page interact through static properties (`$last`, `$current_form`, `$forms`, `$static_errors`, `$style`). Forms are indexed by hash in `$forms` for retrieval during submission.
- **Dual role**: Same class handles both rendering (shortcode callback) and submission processing. `parse()` is called during rendering; `process_submission()` during POST handling.
- **Error storage is static**: Errors live in `self::$static_errors[$form_id]`, not on the instance. This allows errors to persist across form re-renders (e.g., when re-rendering a page after validation failure).
- **JWT for stateless submission**: Form attributes are encrypted into a JWT token embedded as a hidden field. On submission, the JWT reconstructs the form without re-rendering the page.

## Key Methods

These are the methods where the name alone doesn't tell the full story:

- **`parse()`** — The main render entry point, but does far more than parsing: creates the form instance, enqueues assets, sets up Interactivity API config, generates JWT, assembles the full `<form>` HTML output with hidden fields. This is really `render()`.
- **`get_jwt()` / `get_instance_from_jwt()`** — JWT encode/decode with HKDF key derivation and AES-256-GCM encryption. See `flows/jwt-encryption.md` for the full crypto sequence.
- **`get_secret()`** — Resolves the JWT signing secret with a 4-level fallback: filter → Jetpack connection token → stored option → generate new. The fallback chain is important for understanding why forms break after Jetpack reconnection.
- **`process_submission()`** — The other half of the class. Orchestrates the entire submission pipeline: creates Feedback, runs spam checks, stores CPT, builds email, sends it, fires integrations. ~400 lines.
- **`compute_id()`** — Generates form ID from attributes + post context. Understanding this is key to understanding how forms are matched between render and submit.
- **`block_attributes_to_shortcode_attributes()`** — Actually lives on `Contact_Form_Plugin`, but called frequently. The bridge that lets blocks and shortcodes share a rendering pipeline.
- **`validate()`** — Runs field validation and form-level checks. Uses static error storage keyed by form ID. See `flows/field-validation.md`.
- **`wrap_message_in_html_tags()`** — Wraps email content in the HTML template from `templates/email-response.php`.

## State & Lifecycle

### Static (shared across all instances)
| Property | Purpose |
|----------|---------|
| `$last` | Most recently rendered form |
| `$current_form` | Form currently being processed |
| `$forms` | All forms indexed by hash — this is how submission finds the right form |
| `$static_errors` | Errors keyed by form ID (WP_Error instances) |
| `$style` | Whether to enqueue CSS |
| `$ref_id` / `$seen_ref` | Synced form circular reference prevention |

### Instance
| Property | Purpose |
|----------|---------|
| `$hash` | SHA1 of attributes JSON — used as form identifier |
| `$has_verified_jwt` | True if form was reconstructed from valid JWT |
| `$source` | `Feedback_Source` — where this form lives |
| `$is_response_without_reload_enabled` | AJAX submission enabled |

## Hooks

### Key filters consumed
- `jetpack_forms_secret_jwt` — Override JWT signing secret
- `contact_form_to` / `contact_form_subject` — Override email recipients/subject
- `jetpack_contact_form_is_spam` — Spam detection chain
- `grunion_should_send_email` — Override email sending decision (true/false/null)
- `jetpack_contact_form_forget_ip_address` — Strip IP before storage

### Key actions fired
- `grunion_after_feedback_post_inserted` — After feedback CPT saved (triggers webhooks, MailPoet)
- `grunion_pre_message_sent` / `grunion_after_message_sent` — Before/after email

## Gotchas

- **Static state is the source of most complexity.** If you're debugging a multi-form page, check `$forms`, `$static_errors`, and `$current_form` — they're all shared.
- **`parse()` has side effects**: It registers forms in `self::$forms`, enqueues scripts, and stores shortcodes in post meta. It's not a pure render function.
- **JWT secret fallback chain matters**: Forms rendered with one secret and submitted after a Jetpack reconnection (different secret) will fail unless the fallback catches it.
