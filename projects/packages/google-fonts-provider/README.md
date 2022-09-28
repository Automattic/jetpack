# Jetpack Google Fonts Provider Package

WordPress Webfonts provider for Google Fonts

## How to install google-fonts-provider

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-google-fonts-provider). We recommend using the latest version there. You can install it in a composer managed project with `composer require automattic/jetpack-google-fonts-provider`.

You can also test with the latest development versions like below:

```json
"require": {
    "automattic/jetpack-google-fonts-provider": "dev-trunk"
}
```

## Usage

The WordPress Webfonts API is available by activating the Gutenberg plugin and is planned to be included in WordPress 6.0.

### Register the provider

This package contains the provider class, but the provider needs to be registered before it can be used.

```php
wp_register_webfont_provider( 'google-fonts', '\Automattic\Jetpack\Fonts\Google_Fonts_Provider' );
```

### Register fonts

After registering the provider, you can register any of the fonts available in the [Google Fonts catalog](https://fonts.google.com) to make them available for use in the block editor typography settings, Global styles, and your site's CSS.

```php
wp_register_webfont(
		array(
			'font-family' => 'Lato',
			'provider'    => 'google-fonts',
		),
);
```

### Add preconnect link

Adding a preconnect link to the `<head>` of the page will help make sure the font files load as soon as possible, and reduce the layout shift when they are displayed. See [this list of webfont best practices](https://web.dev/font-best-practices/#preconnect-to-critical-third-party-origins) for more details. To do so, we can rely on WordPress' `wp_resource_hints` filter like so:

```php
add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
```

### Additional info

For a discussion about the Webfonts API in WordPress, see https://make.wordpress.org/core/2021/09/28/implementing-a-webfonts-api-in-wordpress-core/.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Google Fonts Provider is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

