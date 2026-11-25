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
- Emails with inline embeds, a non-UTF-8 charset, a multipart body with a custom boundary, or only Cc/Bcc recipients are handed to default mail, even when backup mail (the `fallback` setting) is off.
- From addresses outside the sending domain are rewritten to the configured From address, and the original address is kept as Reply-To.

## Hooks

- `jetpack_send_provisioner`: filters the provisioner Send uses to create the sending account.
- `jetpack_send_log_retention_days`: sets how many days Send keeps email log rows, overriding the Email log setting (default 7 days for new sites; 0 keeps them until they're deleted). While it's set, the setting can't be changed.
- `jetpack_send_log_email_content`: return false to keep an email's content out of the log, so it can't be previewed or resent. Its addresses are still kept. Receives the `wp_mail()` arguments.
- `jetpack_send_log_redact_patterns`: more regular expressions for sign-in links to strip from stored emails. A pattern's first capture group is removed, or the whole match when it has none.
- `jetpack_send_resend_limit`: how many emails a site can resend from the Log per hour (default 20).
- `jetpack_send_pre_existing_spf`: short-circuits the DNS lookup of a domain's existing SPF record; return the record, or an empty string for none.
- `jetpack_send_pre_dns_lookup`: short-circuits any DNS lookup Send makes; return the records to use, an empty array for none, or false for a failed lookup.
- `jetpack_send_suggested_domain`: the domain Send suggests sending from, for a site whose address isn't the domain it sends from.
- `jetpack_send_cloudflare_api_enabled`: return false to stop offering to add the records at Cloudflare with a pasted API token (default true). The token is used once and never stored.

## Data

Send keeps three tables, all removed when the plugin is deleted:

- `{prefix}jetpack_send_log`: one row per email, with its addresses, subject, content (sign-in links removed), status and failure details. Rows are deleted once they're older than the Email log setting: 1, 7, 30, 90, 180 or 365 days, or kept until deleted (0). New sites keep 7 days; sites that had a log before the setting existed keep 30.
- `{prefix}jetpack_send_stats`: the dashboard's counts, per site-local hour, status, type and sending plugin. No addresses, subjects or content. Kept for 800 days, so the dashboard's numbers survive retention and deletes.
- `{prefix}jetpack_send_debug`: the debug log. Off by default; once turned on it records for 1, 7 or 30 days, then turns itself off, and each entry is deleted that long after it was written (at most 20,000 entries). Context is redacted on the way in: no keys, tokens, bodies, subjects, full addresses or server paths.

The log isn't yet part of WordPress's personal data export and erase tools.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

send is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
