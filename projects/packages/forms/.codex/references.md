# External References

## Gutenberg (Block Editor)

Gutenberg is the source of the `@wordpress/*` packages and the block editor environment. The forms package depends heavily on it for block registration, rendering, and frontend interactivity.

- **Local clone**: `<local-gutenberg-clone>`
- **GitHub**: https://github.com/WordPress/gutenberg

### Key source locations

| What | Local path | GitHub path |
|------|------------|-------------|
| Interactivity API | `packages/interactivity/` | [packages/interactivity](https://github.com/WordPress/gutenberg/tree/trunk/packages/interactivity) |
| Block registration (`registerBlockType`) | `packages/blocks/src/api/registration.js` | [packages/blocks](https://github.com/WordPress/gutenberg/tree/trunk/packages/blocks) |
| Block supports (color, typography, border, spacing) | `lib/block-supports/` | [lib/block-supports](https://github.com/WordPress/gutenberg/tree/trunk/lib/block-supports) |
| `wp_apply_colors_support()` | `lib/block-supports/colors.php` | [colors.php](https://github.com/WordPress/gutenberg/blob/trunk/lib/block-supports/colors.php) |
| `wp_apply_typography_support()` | `lib/block-supports/typography.php` | [typography.php](https://github.com/WordPress/gutenberg/blob/trunk/lib/block-supports/typography.php) |
| `wp_apply_border_support()` | `lib/block-supports/border.php` | [border.php](https://github.com/WordPress/gutenberg/blob/trunk/lib/block-supports/border.php) |
| `wp_apply_spacing_support()` | `lib/block-supports/spacing.php` | [spacing.php](https://github.com/WordPress/gutenberg/blob/trunk/lib/block-supports/spacing.php) |
| Layout support (flex, flow) | `lib/block-supports/layout.php` | [layout.php](https://github.com/WordPress/gutenberg/blob/trunk/lib/block-supports/layout.php) |
| InnerBlocks component | `packages/block-editor/src/components/inner-blocks/` | [inner-blocks](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/inner-blocks) |
| Theme JSON | `lib/class-wp-theme-json-gutenberg.php` | [theme-json](https://github.com/WordPress/gutenberg/tree/trunk/lib) |

### Packages used by Forms

| Package | Used for |
|---------|----------|
| `@wordpress/interactivity` | Frontend form behavior (AJAX submission, validation) via `wp-interactive="jetpack/form"` |
| `@wordpress/blocks` | Block registration and metadata |
| `@wordpress/block-editor` | Editor components, InnerBlocks, block supports |
| `@wordpress/element` | React wrapper (`createElement`, hooks) |
| `@wordpress/components` | UI components in editor sidebar |
| `@wordpress/data` | Data stores for editor state |
| `@wordpress/i18n` | Translations |
| `@wordpress/icons` | Block icons |

## WordPress Core

- [Shortcode API](https://developer.wordpress.org/plugins/shortcodes/) -- Contact_Form_Shortcode base class uses this
- [Custom Post Types](https://developer.wordpress.org/plugins/post-types/) -- `feedback` and `jetpack_form` CPTs
- [register_post_status()](https://developer.wordpress.org/reference/functions/register_post_status/) -- `spam` and `jp-temp-feedback` statuses
- [WP_REST_Controller](https://developer.wordpress.org/rest-api/extending-the-rest-api/) -- Contact_Form_Endpoint extends this
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/) -- Block registration and rendering
- [WordPress Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/) -- Used for frontend form behavior (view.js)
- [wp_mail()](https://developer.wordpress.org/reference/functions/wp_mail/) -- Email sending
- [PHPMailer in WordPress](https://developer.wordpress.org/reference/classes/phpmailer/) -- Plain text alternative via phpmailer_init hook
- [Personal Data Exporters/Erasers](https://developer.wordpress.org/plugins/privacy/) -- GDPR compliance

## Jetpack Packages

- `automattic/jetpack-connection` -- `Tokens` class used for JWT secret retrieval
- `automattic/jetpack-jwt` -- `JWT::encode()` / `JWT::decode()` for form token signing
- `automattic/jetpack-sync` -- `Settings::is_syncing()` check to skip rendering during sync
- `automattic/jetpack-blocks` -- `Blocks::jetpack_register_block()` for block registration
- `automattic/jetpack-assets` -- Asset URL generation for editor scripts
- `automattic/jetpack-status` -- `Request::is_frontend()` for context detection

## Third-Party Integrations

- [Akismet](https://akismet.com/) -- Spam detection via `jetpack_contact_form_is_spam` filter
- [MailPoet](https://www.mailpoet.com/) -- Subscriber integration via `grunion_after_feedback_post_inserted` hook
- [Salesforce](https://www.salesforce.com/) -- Legacy POST-to-URL integration via `Post_To_Url` class

## Key WordPress Hooks (Forms Package)

### Actions fired
- `grunion_after_feedback_post_inserted` -- After feedback CPT is saved (used by MailPoet, Hostinger, webhooks)
- `grunion_pre_message_sent` -- Just before email is sent
- `grunion_after_message_sent` -- After email is sent
- `grunion_scheduled_delete` -- Daily spam cleanup cron
- `grunion_scheduled_delete_temp` -- Daily temp feedback cleanup cron

### Filters consumed
- `jetpack_contact_form_is_spam` -- Spam detection chain (blocklist, Akismet)
- `jetpack_contact_form_in_comment_disallowed_list` -- WordPress disallowed list check
- `contact_form_to` -- Override email recipients
- `contact_form_subject` -- Override email subject
- `grunion_should_send_email` -- Override email sending decision (true/false/null)
- `grunion_still_email_spam` -- Whether to email spam submissions
- `jetpack_contact_form_email_headers` -- Customize email headers
- `jetpack_forms_secret_jwt` -- Override JWT signing secret
- `jetpack_forms_extra_webhooks` -- Add programmatic webhooks
- `jetpack_forms_dashboard_enable` -- Toggle feedback dashboard
- `jetpack_forms_webhooks_enabled` -- Toggle webhook feature
