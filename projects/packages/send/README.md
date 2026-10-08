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
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

send is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
