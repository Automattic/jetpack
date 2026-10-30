# send

Transactional email for Jetpack sites. Send replaces the host's `wp_mail()` delivery with the MailChannels Email API, using a MailChannels sub-account provisioned for the site.

```php
\Automattic\Jetpack\Send\Send::init();
```

The dashboard is a `@wordpress/build` page under the `jetpack-send` menu slug (routes in `routes/`, screens in `_inc/`).

## Development provisioner

Until the WordPress.com provisioning endpoints exist, define a MailChannels parent account API key in `wp-config.php` to provision sub-accounts directly:

```php
define( 'JETPACK_SEND_MAILCHANNELS_PARENT_API_KEY', '…' );
define( 'JETPACK_SEND_MAILCHANNELS_SEND_LIMIT', 3000 ); // Optional.
define( 'JETPACK_SEND_MAILCHANNELS_DNS_ZONE', 'send-dns.example.com' ); // Optional.
```

With `JETPACK_SEND_MAILCHANNELS_DNS_ZONE`, customers add CNAMEs for Domain Lockdown and DKIM that point into that zone, and the dashboard lists the TXT records the zone must publish. You need to control that zone for the CNAMEs to resolve. Without it, customers add the TXT values directly.

SPF is optional whenever the domain has a DKIM record, because DMARC passes on aligned DKIM.

## Compatibility

Send delivers mail through the MailChannels API instead of PHPMailer, so some `wp_mail()` behavior differs:

- `phpmailer_init` is not applied to mail Send delivers, because no PHPMailer object exists.
- Emails with inline embeds, a non-UTF-8 charset, a multipart body with a custom boundary, or only Cc/Bcc recipients are handed to default mail, even when the fallback setting is off.
- From addresses outside the sending domain are rewritten to the configured From address, and the original address is kept as Reply-To.

## Hooks

- `jetpack_send_provisioner`: filters the provisioner Send uses to create the sending account.
- `jetpack_send_log_retention_days`: filters how many days Send keeps email log rows (default 30).
- `jetpack_send_log_email_content`: return false to keep an email's content out of the log, so it can't be previewed. Receives the `wp_mail()` arguments.
- `jetpack_send_pre_existing_spf`: short-circuits the DNS lookup of a domain's existing SPF record; return the record, or an empty string for none.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

send is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
