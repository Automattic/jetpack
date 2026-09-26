# WordAds

The Ads section of the Premium Analytics dashboard: the section registration, its default layout, and the three widget types the section renders, built here with wp-build and resolved against the dashboard's shared modules through its import map.

The package decides nothing about who gets Ads. The WordAds module of the Jetpack plugin calls `Analytics_Dashboard::init()` outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes WordAds.

## Using this package in your WordPress plugin

Require it with Composer, build it (`pnpm run build`), and call `\Automattic\Jetpack\WordAds\Analytics_Dashboard::init()` before `init`. The registrations happen when the dashboard's registries hydrate, so the call is inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-ads is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
