# Email Sending

## When this happens

After a form submission is validated and stored as a feedback CPT, the system decides whether to send an email notification to the form recipients.

## Entry point

`src/contact-form/class-contact-form.php:2721` -- Email assembly begins inside `process_submission()` after feedback storage.

## Sequence

### Phase 1: Email Content Assembly (line 2721-2735)

1. Build context data array with time, URL, author info, spam status (line 2722-2730)
2. Call `Feedback_Email_Renderer::build_email_content($post_id, $form, $response, $context_data)` (line 2731)

Inside `Feedback_Email_Renderer::build_email_content()` (`class-feedback-email-renderer.php:64`):

3. Apply `jetpack_forms_response_email_title` filter for email title (line 83)
4. Compile form fields for email display via `get_compiled_form_for_email()` (line 84)
5. Build footer with timestamp, source URL, IP address (lines 96-144)
6. Build action links: view in dashboard, mark as spam (lines 146-200+)
7. Build respondent info section: name, email, avatar (lines 200+)
8. Wrap everything in HTML template via `Contact_Form::wrap_message_in_html_tags()` (line 250+)

### Phase 2: Send Decision (lines 2737-2773)

9. Store rendered email as post meta `_feedback_email` for resend capability (line 2735)
10. Check `grunion_should_send_email` filter (line 2751):
    - `true`: Always send, override attribute
    - `false`: Never send, override attribute
    - `null` (default): Use `emailNotifications` attribute
11. If filter returns null, check `$this->get_attribute('emailNotifications') !== 'no'` (line 2762)
12. Determine if spam should be emailed: `grunion_still_email_spam` filter (line 2770)
13. Final decision: `$will_send = (not_spam && send_email) || (is_spam && send_even_if_spam)` (line 2773)

### Phase 3: Sending (lines 2775-2791)

14. If sending: fire `grunion_pre_message_sent` action (line 2788)
15. Call `Contact_Form::wp_mail($to, $subject, $message, $headers)` (line 2790)

Inside `wp_mail()` (`class-contact-form.php:2957`):
16. Add `phpmailer_init` filter for `add_plain_text_alternative` (line 2964)
17. Call WordPress `wp_mail()` with HTML content type
18. Remove the filter after sending

### Phase 4: Post-Send (lines 2793-2818)

19. Schedule spam/temp cleanup crons if not already scheduled (lines 2793-2801)
20. Fire `grunion_after_message_sent` action with all context (line 2818)

## Email Recipients

Determined earlier in `process_submission()` (lines 2432-2468):
1. Parse `to` attribute, split by comma
2. Validate each as email, filter unsafe addresses
3. If no valid emails: fall back to `$this->defaults['to']` (set from post author email)
4. Last resort: `get_option('admin_email')`
5. Apply `contact_form_to` filter (line 2555)
6. Add display name to each address via `add_name_to_address()` (line 2560)

## Email Headers

Built at lines 2585-2612:
- `From: {author_name} <wordpress@{site_domain}>`
- `Reply-To: {author_name} <{author_email}>` (or first recipient if no author email)
- Customizable via `jetpack_contact_form_email_headers` filter (line 2606)

Content type set to HTML via `get_mail_content_type()` (line 2993) which returns `text/html`.

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
| `src/contact-form/class-feedback-field.php` | Per-field email rendering (`get_render_email_html_value()` dispatches to type-specific renderers) |
| `src/contact-form/class-feedback.php` | `get_compiled_fields()` provides field data for email |
| `src/contact-form/templates/email-response.php` | HTML email template |
| `src/contact-form/images/file-icons/` | File-type icons (SVG source + rasterized `@2x.png` for email) |

## Gotchas

- **File field value structure differs by loading path**: `Feedback::process_file_field_value()` (computed fields during submission) returns `{files: [...]}` without `field_id`. The legacy path (`is_legacy_file_upload`) returns `{field_id, files}`. This means `Contact_Form::is_file_upload_field()` is unreliable inside field renderers where the field type is already known — use `is_of_type('file')` or check for the `files` array directly instead.
- **File-type icon mapping**: The canonical icon mapping for file types lives in `modules/file-field/view.js` `getFileIcon()` (extension → icon, then MIME category fallback). The PHP equivalent is `Feedback_Field::get_file_icon_name()`. Both should be kept in sync.
- **Email icons must be PNG**: Email clients have inconsistent SVG support. All icons used in emails (both field-type icons in `field-icons/` and file-type icons in `file-icons/`) are rasterized to `@2x.png` via `tools/rasterize-icons.mjs`. Always reference the PNG, not the SVG.
- **Email stored even when not sent**: The rendered email is always stored as `_feedback_email` post meta (line 2735), regardless of whether it's actually sent. This enables the resend feature in the REST API.
- **Plain text alternative**: `add_plain_text_alternative()` (line 3023) hooks into `phpmailer_init` to add a plain text version via `$phpmailer->AltBody`. This filter is added before `wp_mail()` and removed after.
- **Subject prefix for spam**: If the submission is spam and `grunion_still_email_spam` allows sending, the subject is prefixed with `***SPAM***` (line 2790 via `$spam` variable).
- **HTML content type is global**: `get_mail_content_type()` returns `text/html`. It's added/removed as a filter around `wp_mail()` to avoid affecting other emails.
- **grunion_should_send_email precedence**: This filter takes strict precedence. Returning `true` sends even spam. Returning `false` suppresses all email. Only `null` defers to the attribute.
