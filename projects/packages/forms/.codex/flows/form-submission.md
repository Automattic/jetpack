# Form Submission

## When this happens

When a user submits a contact form via POST (traditional form submit or AJAX).

## Entry point

`src/contact-form/class-contact-form-plugin.php:330-338` -- In the `__construct()`, if the request is a POST with `action=grunion-contact-form`, hooks `process_form_submission` to `template_redirect`.

AJAX entry: `src/contact-form/class-contact-form-plugin.php:226-227` -- `wp_ajax_grunion-contact-form` and `wp_ajax_nopriv_grunion-contact-form` both call `ajax_request()` which delegates to `process_form_submission()`.

## Sequence

### Phase 1: Routing (`process_form_submission`, line 1571)

1. Block preview submissions (line 1573)
2. Extract `contact-form-id` and `contact-form-hash` from POST data (line 1581-1583)
3. Nonce check for logged-in users (line 1590-1592)
4. Determine form source: widget, block template, block template part, or post (line 1594-1596)

### Phase 2: Form Reconstruction

**JWT path** (preferred, line 1598-1688):
5. If `jetpack_contact_form_jwt` is in POST, decode JWT to reconstruct the `Contact_Form` instance via `Contact_Form::get_instance_from_jwt()` -- see `flows/jwt-encryption.md`
6. Validate parent post still exists and isn't trashed (line 1612)
7. Run `$form->validate()` (line 1617) -- see `flows/field-validation.md`
8. Initialize integrations: Salesforce/Post-to-URL, webhooks (lines 1623-1685)
9. Call `$form->process_submission()` (line 1687)

**Legacy path** (fallback when no JWT, line 1692-1876):
5. Re-render the content source (widget/template/post) to populate `Contact_Form::$forms` static array
6. Look up form by hash: `Contact_Form::$forms[$hash]` (line 1812)
7. If not found, try stored shortcode from post meta `_g_feedback_shortcode_{$hash}` (line 1818)
8. Validate parent post, initialize integrations
9. Call `$form->process_submission()` (line 1875)

### Phase 3: Submission Processing (`process_submission`, line 2426)

10. Create `Feedback` response object from POST data: `Feedback::from_submission($_POST, $this)` (line 2428)
11. Extract form attributes: `to`, `subject`, widget/template context (lines 2432-2438)
12. Validate email recipients, fall back to defaults if invalid (lines 2443-2468)
13. Verify form ID matches (unless JWT-verified) to prevent cross-form submission (lines 2470-2487)

### Phase 4: Spam Detection (lines 2517-2539)

14. Prepare values for Akismet via `$plugin->prepare_for_akismet()` (line 2518)
15. Run spam filter chain: `apply_filters('jetpack_contact_form_is_spam', false, $akismet_values)` (line 2522)
    - `is_spam_blocklist()` checks WordPress blocklist (line 2195)
    - `is_spam_akismet()` sends to Akismet API if available (line 2285)
16. Run disallowed list filter (line 2539)
17. Determine feedback status: `publish`, `spam`, `trash` (disallowed), or `jp-temp-feedback` (save disabled) (lines 2636-2644)

### Phase 5: Storage (lines 2669-2705)

18. Add `wp_insert_post_data` filter to force author to 0 (line 2669)
19. Optionally strip IP address via `jetpack_contact_form_forget_ip_address` filter (line 2684)
20. Save feedback as CPT: `$response->save()` (line 2689)
21. Store extra fields and Akismet values as post meta (lines 2697-2705)
22. Fire `grunion_after_feedback_post_inserted` action (line 2719) -- triggers webhooks, MailPoet, etc.

### Phase 6: Email (lines 2721-2791)

23. Build email via `Feedback_Email_Renderer::build_email_content()` (line 2731) -- see `flows/email-sending.md`
24. Store rendered email as post meta for resend capability (line 2735)
25. Determine whether to send: `grunion_should_send_email` filter → `emailNotifications` attribute (lines 2751-2763)
26. If sending: fire `grunion_pre_message_sent`, call `Contact_Form::wp_mail()` (line 2790)
27. Fire `grunion_after_message_sent` action (line 2818)

### Phase 7: Response (lines 2820-2854)

28. Build redirect args with form ID, feedback ID, hash, nonce
29. If request accepts JSON and response-without-reload enabled: return JSON via `wp_send_json()` (line 2835)
30. If AJAX: return success message HTML (line 2847)
31. Otherwise: redirect to form page with success query params (line 2853)

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
| `src/contact-form/class-contact-form-field.php` | Field validation during `$form->validate()` |
| `src/contact-form/class-feedback-email-renderer.php` | Email HTML assembly |
| `src/contact-form/class-feedback-source.php` | Tracks where form lives for redirects |
| `src/contact-form/class-form-submission-error.php` | Error wrapping |
| `src/service/class-form-webhooks.php` | Webhook delivery after storage |
| `src/service/class-mailpoet-integration.php` | MailPoet subscriber on `grunion_after_feedback_post_inserted` |

## Gotchas

- **Legacy path re-renders content**: When no JWT is present, the entire post/template content is rendered via `apply_filters('the_content', $content)` just to populate `Contact_Form::$forms`. This is why the JWT path is preferred.
- **Static form lookup**: Forms are found by hash in `Contact_Form::$forms[$hash]`. If the hash doesn't match (e.g., post was edited between render and submit), submission fails with "Form not found."
- **Nonce only for logged-in users**: Anonymous submissions don't verify nonces (see comment at line 1580). Security relies on the JWT token instead.
- **IP stripping**: The `jetpack_contact_form_forget_ip_address` filter removes IP before storage but *after* Akismet checks. Akismet still gets the real IP.
