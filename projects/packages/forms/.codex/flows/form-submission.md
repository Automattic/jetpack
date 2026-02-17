# Form Submission

<!-- verified: 2026-02-17, commit: 8225b1ff -->

## When this happens

When a user submits a contact form via POST (traditional form submit or AJAX).

## Entry point

`Contact_Form_Plugin::__construct()` — if the request is a POST with `action=grunion-contact-form`, hooks `process_form_submission` to `template_redirect`.

AJAX entry: `wp_ajax_grunion-contact-form` and `wp_ajax_nopriv_grunion-contact-form` both call `Contact_Form_Plugin::ajax_request()` which delegates to `process_form_submission()`.

## Sequence

### Phase 1: Routing — `Contact_Form_Plugin::process_form_submission()`

1. Block preview submissions
2. Extract `contact-form-id` and `contact-form-hash` from POST data
3. Nonce check for logged-in users
4. Determine form source: widget, block template, block template part, or post

### Phase 2: Form Reconstruction

**JWT path** (preferred):
5. If `jetpack_contact_form_jwt` is in POST, decode JWT to reconstruct the `Contact_Form` instance via `Contact_Form::get_instance_from_jwt()` — see `flows/jwt-encryption.md`
6. Validate parent post still exists and isn't trashed via `validate_parent_post()`
7. Run `Contact_Form::validate()` — see `flows/field-validation.md`
8. Initialize integrations: Salesforce/Post-to-URL, webhooks
9. Call `Contact_Form::process_submission()`

**Legacy path** (fallback when no JWT):
5. Re-render the content source (widget/template/post) to populate `Contact_Form::$forms` static array
6. Look up form by hash: `Contact_Form::$forms[$hash]`
7. If not found, try stored shortcode from post meta `_g_feedback_shortcode_{$hash}`
8. Validate parent post, initialize integrations
9. Call `Contact_Form::process_submission()`

### Phase 3: Submission Processing — `Contact_Form::process_submission()`

10. Create `Feedback` response object: `Feedback::from_submission($_POST, $this)`
11. Extract form attributes: `to`, `subject`, widget/template context
12. Validate email recipients, fall back to defaults if invalid
13. Verify form ID matches (unless JWT-verified) to prevent cross-form submission

### Phase 4: Spam Detection

14. Prepare values for Akismet via `Contact_Form_Plugin::prepare_for_akismet()`
15. Run spam filter chain: `apply_filters('jetpack_contact_form_is_spam', ...)`
    - `Contact_Form_Plugin::is_spam_blocklist()` checks WordPress blocklist
    - `Contact_Form_Plugin::is_spam_akismet()` sends to Akismet API if available
16. Run disallowed list filter
17. Determine feedback status: `publish`, `spam`, `trash` (disallowed), or `jp-temp-feedback` (save disabled)

### Phase 5: Storage

18. Add `wp_insert_post_data` filter to force author to 0 via `insert_feedback_filter()`
19. Optionally strip IP address via `jetpack_contact_form_forget_ip_address` filter
20. Save feedback as CPT: `Feedback::save()`
21. Store extra fields and Akismet values as post meta
22. Fire `grunion_after_feedback_post_inserted` action — triggers webhooks, MailPoet, etc.

### Phase 6: Email

23. Build email via `Feedback_Email_Renderer::build_email_content()` — see `flows/email-sending.md`
24. Store rendered email as post meta `_feedback_email` for resend capability
25. Determine whether to send: `grunion_should_send_email` filter → `emailNotifications` attribute
26. If sending: fire `grunion_pre_message_sent`, call `Contact_Form::wp_mail()`
27. Fire `grunion_after_message_sent` action

### Phase 7: Response

28. Build redirect args with form ID, feedback ID, hash, nonce
29. If request accepts JSON and response-without-reload enabled: return JSON via `wp_send_json()`
30. If AJAX: return success message HTML
31. Otherwise: redirect to form page with success query params

## Key decisions

- **JWT vs Legacy path**: JWT is the modern path where form attributes are securely encoded in the token. Legacy path must re-render the entire page content to find the form, which is expensive and fragile. JWT path skips this entirely.
- **Spam handling**: Spam submissions are still stored (as `spam` status) but not emailed by default. The `grunion_still_email_spam` filter can override this.
- **saveResponses=no**: Uses `jp-temp-feedback` status. Still saved to DB (so integrations/webhooks work) but excluded from the inbox dashboard.
- **Author zeroing**: Feedback posts always have `post_author = 0` to prevent user creation during export/import.
- **Scheduled cleanup**: Spam feedback is deleted daily via `grunion_scheduled_delete` cron. Temp feedback via `grunion_scheduled_delete_temp`.

## Files involved

| File | Role |
|------|------|
| `src/contact-form/class-contact-form-plugin.php` | Submission routing, spam filters, AJAX handling |
| `src/contact-form/class-contact-form.php` | `process_submission()`, JWT decoding, email sending, validation |
| `src/contact-form/class-feedback.php` | `from_submission()` creates response, `save()` stores as CPT |
| `src/contact-form/class-contact-form-field.php` | Field validation during `validate()` |
| `src/contact-form/class-feedback-email-renderer.php` | Email HTML assembly |
| `src/contact-form/class-feedback-source.php` | Tracks where form lives for redirects |
| `src/contact-form/class-form-submission-error.php` | Error wrapping |
| `src/service/class-form-webhooks.php` | Webhook delivery after storage |
| `src/service/class-mailpoet-integration.php` | MailPoet subscriber on `grunion_after_feedback_post_inserted` |

## Gotchas

- **Legacy path re-renders content**: When no JWT is present, the entire post/template content is rendered via `apply_filters('the_content', $content)` just to populate `Contact_Form::$forms`. This is why the JWT path is preferred.
- **Static form lookup**: Forms are found by hash in `Contact_Form::$forms[$hash]`. If the hash doesn't match (e.g., post was edited between render and submit), submission fails with "Form not found."
- **Nonce only for logged-in users**: Anonymous submissions don't verify nonces. Security relies on the JWT token instead.
- **IP stripping**: The `jetpack_contact_form_forget_ip_address` filter removes IP before storage but *after* Akismet checks. Akismet still gets the real IP.
