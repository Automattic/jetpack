# sharing-likes

Sharing buttons and Like buttons for your posts.

Today the package ships the wp-admin **Settings > Sharing** screen, under
`src/settings/`, and the same settings over REST, under `wpcom/v2/sharing-likes/`,
for the React version of the screen. A host plugin sets both up with one call,
on every request rather than in an `is_admin()` branch, since REST requests are
not admin requests:

```php
\Automattic\Jetpack\Sharing_Likes\Initializer::init();
```

Neither depends on a module being active: the screen and every section on it
exist whichever modules are on, on any site that is Simple, connected, or in
offline mode.

It also ships the per-post Likes and Sharing switches the block editor shows, as
REST fields on every public post type. `Initializer::init()` leaves these out:
each belongs to the feature that reads it, so call it wherever that feature
loads (Likes or Comment Likes, and Sharing), outside any `is_admin()` branch:

```php
\Automattic\Jetpack\Sharing_Likes\Post_Likes_Switch::init();
\Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::init();
```

Calling either more than once is harmless.

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

