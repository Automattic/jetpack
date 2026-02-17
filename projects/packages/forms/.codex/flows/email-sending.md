# Email Sending

<!-- verified: 2026-02-17, commit: 8225b1ff -->

## When this happens

After a form submission is validated and stored as a feedback CPT, the system decides whether to send an email notification to the form recipients.

## Entry point

Inside `Contact_Form::process_submission()` (class-contact-form.php) — email assembly begins after feedback storage.

## Sequence

### Phase 1: Email Content Assembly

1. Build context data array with time, URL, author info, spam status
2. Call `Feedback_Email_Renderer::build_email_content($post_id, $form, $response, $context_data)`

Inside `Feedback_Email_Renderer::build_email_content()`:

3. Apply `jetpack_forms_response_email_title` filter for email title
4. Compile form fields for email display via `Contact_Form::get_compiled_form_for_email()`
5. Build footer with timestamp, source URL, IP address
6. Build action links: view in dashboard, mark as spam
7. Build respondent info section: name, email, avatar
8. Wrap everything in HTML template via `Contact_Form::wrap_message_in_html_tags()`

### Phase 2: Send Decision

9. Store rendered email as post meta `_feedback_email` for resend capability
10. Check `grunion_should_send_email` filter:
    - `true`: Always send, override attribute
    - `false`: Never send, override attribute
    - `null` (default): Use `emailNotifications` attribute
11. If filter returns null, check `$this->get_attribute('emailNotifications') !== 'no'`
12. Determine if spam should be emailed: `grunion_still_email_spam` filter
13. Final decision: `$will_send = (not_spam && send_email) || (is_spam && send_even_if_spam)`

### Phase 3: Sending

14. If sending: fire `grunion_pre_message_sent` action
15. Call `Contact_Form::wp_mail($to, $subject, $message, $headers)`

Inside `Contact_Form::wp_mail()`:
16. Add `phpmailer_init` filter for `Contact_Form::add_plain_text_alternative()`
17. Call WordPress `wp_mail()` with HTML content type
18. Remove the filter after sending

### Phase 4: Post-Send

19. Schedule spam/temp cleanup crons if not already scheduled
20. Fire `grunion_after_message_sent` action with all context

## Email Recipients

Determined earlier in `Contact_Form::process_submission()`:
1. Parse `to` attribute, split by comma
2. Validate each as email, filter unsafe addresses
3. If no valid emails: fall back to `$this->defaults['to']` (set from post author email)
4. Last resort: `get_option('admin_email')`
5. Apply `contact_form_to` filter
6. Add display name to each address via `Contact_Form::add_name_to_address()`

## Email Headers

- `From: {author_name} <wordpress@{site_domain}>`
- `Reply-To: {author_name} <{author_email}>` (or first recipient if no author email)
- Customizable via `jetpack_contact_form_email_headers` filter

Content type set to HTML via `Contact_Form::get_mail_content_type()`.

## Decision Tree

```
grunion_should_send_email filter
  |
  +-- true  --> SEND (always)
  |
  +-- false --> DON'T SEND (always)
  |
  +-- null (default)
       |
       +-- emailNotifications attribute
            |
            +-- 'no' --> DON'T SEND
            |
            +-- anything else --> Check spam
                 |
                 +-- not spam --> SEND
                 |
                 +-- is spam
                      |
                      +-- grunion_still_email_spam
                           |
                           +-- true  --> SEND (with ***SPAM*** prefix)
                           |
                           +-- false --> DON'T SEND
```

## Files involved

| File | Role |
|------|------|
| `src/contact-form/class-contact-form.php` | Send decision logic, `wp_mail()` wrapper, `add_plain_text_alternative()` |
| `src/contact-form/class-feedback-email-renderer.php` | `build_email_content()`, field compilation, HTML template assembly |
| `src/contact-form/class-feedback-field.php` | Per-field email rendering via `get_render_email_html_value()` |
| `src/contact-form/class-feedback.php` | `get_compiled_fields()` provides field data for email |
| `src/contact-form/templates/email-response.php` | HTML email template |
| `src/contact-form/images/file-icons/` | File-type icons (SVG source + rasterized `@2x.png` for email) |

## Gotchas

- **File field value structure differs by loading path**: `Feedback::process_file_field_value()` (computed fields during submission) returns `{files: [...]}` without `field_id`. The legacy path (`is_legacy_file_upload`) returns `{field_id, files}`. Use `is_of_type('file')` or check for the `files` array directly instead of relying on `Contact_Form::is_file_upload_field()`.
- **File-type icon mapping**: The canonical icon mapping lives in `modules/file-field/view.js` `getFileIcon()` (extension → icon, then MIME category fallback). The PHP equivalent is `Feedback_Field::get_file_icon_name()`. Both should be kept in sync.
- **Email icons must be PNG**: Email clients have inconsistent SVG support. Icons are rasterized to `@2x.png` via `tools/rasterize-icons.mjs`. Always reference the PNG.
- **Email stored even when not sent**: The rendered email is always stored as `_feedback_email` post meta, regardless of whether it's actually sent. This enables the resend feature in the REST API.
- **Plain text alternative**: `Contact_Form::add_plain_text_alternative()` hooks into `phpmailer_init` to add a plain text version via `$phpmailer->AltBody`. The filter is added before `wp_mail()` and removed after.
- **HTML content type is global**: `get_mail_content_type()` returns `text/html`. It's added/removed as a filter around `wp_mail()` to avoid affecting other emails.
- **grunion_should_send_email precedence**: This filter takes strict precedence. Returning `true` sends even spam. Returning `false` suppresses all email. Only `null` defers to the attribute.
