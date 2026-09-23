# sharing-likes

Sharing buttons and Like buttons for your posts.

Today the package ships the wp-admin **Settings > Sharing** screen, under
`src/settings/`. A host plugin registers it:

```php
\Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::init();
\Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler::init();
```

Both calls belong in an `is_admin()` branch, and neither depends on a module
being active: the screen and every section on it exist whatever the site is
running.

## How to install sharing-likes

### Installation From Git Repo

## Contribute

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

sharing-likes is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

