# React DataSync Client

## Debug

WP JS DataSync has a debug mode that can be used to disable certain DataSync values. Read more about it [here](../../packages/wp-js-data-sync/README.md#debug).

Disabling DataSync values via the WP JS DataSync package will disable them on the first page load, but not on the endpoints. You can ask React DataSync Client to disable certain endpoints by adding a `#ds-debug-disable` hash to the URL.

To disable a DataSync endpoint request, add `#ds-debug-disable=<endpoint-key>` to the URL.
To disable all DataSync endpoint requests, add `#ds-debug-disable=all` to the URL.

#### Debug Example
If your dashboard URL is `https://example.com/wp-admin/admin.php?page=example`, and you want to disable the `widget_status` endpoint, you would navigate to `https://example.com/wp-admin/admin.php?page=example#ds-debug-disable=widget_status`.

You can also disable all endpoints by adding `#ds-debug-disable=all` to the URL.

### Installation From Git Repo

## Contribute

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

react-data-sync-client is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
