# VideoPress

VideoPress package

## How to consume VideoPress package

### Install the right packages

First, let's make sure that the `automattic/jetpack-videopress` package is set up in your composer.json file:

At minimum you need three things. One is the `automattic/jetpack-autoloader` package, which will ensure that you're not colliding with any other plugins on the site that may be including the same packages. Two, of course, is the `automattic/jetpack-videopress` package. Third is our `automattic/jetpack-config` package that will be your tool for initializing the packages.

### Initialize the package

Second, we must initialize ("configure") the `jetpack-videopress` package within your plugin, and provide the information about it.

This is where the `jetpack-config` and `jetpack-autoload` packages come into play. Do this, and you're ready to start consuming the Jetpack connection!

```php
use Automattic\Jetpack\Config;

require_once plugin_dir_path( __FILE__ ) . 'vendor/autoload_packages.php';

function jpcs_load_plugin() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure( 'videopress' );
}

add_action( 'plugins_loaded', 'jpcs_load_plugin', 1 );
```

### Initialization Options

When initializing VideoPress, you can choose whether you want to initialize the Admin UI or not. By default, the admin UI is not initialized. If you want it, just add the `admin_ui` key in your options when ensuring the feature:

```PHP
$config = new Config();
$config->ensure(
	'videopress',
	array( 'admin_ui' => true )
);
```

## Development

Build all bundles

```cli
jetpack build packages/videopress
```

Build in watching dog mode 🐕

```cli
jetpack watch packages/videopress
```

## Trim and cut metrics

The dashboard editor and block-editor modal record three Tracks events:

- `jetpack_videopress_trim_cut_submitted`: the edit, restore, or retry request returned an identified job for this video. Acceptance is not processing success.
- `jetpack_videopress_trim_cut_submission_failed`: the request rejected, with `reason` limited to `conflict` or `request_error`. A network error does not establish whether the server accepted the request.
- `jetpack_videopress_trim_cut_processed`: the initiating mounted editor observed that job finish, with `outcome` of `complete` or `failed`. Repeated observations emit once per accepted job.

All events include `source` (`dashboard_editor` or `block_editor`) and `action` (`save`, `restore`, or `retry`). Saves also include `has_trim` and `cut_count` (capped at 100, meaning 100 or more). These describe the submitted operations, including previously saved operations retained by this edit, not the number of handle movements or newly added cuts. A save removing every operation has `has_trim=false` and `cut_count=0`. Restore/retry omit these fields because the current draft does not describe the server's restore or retained retry instructions.

Cancel/discard and historical jobs emit nothing. Closing/reloading the editor or losing observation can leave accepted jobs without a recorded outcome; do not treat that gap as failure or use it as a whole-product processing success rate. No extra polling is added. Events contain no video/job identifiers, URLs, content, or timeline timestamps and reuse existing analytics transport. Host eligibility, opt-out behavior and warehouse delivery still need rollout verification before reporting adoption or reliability.

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Premium Analytics dashboard

The package owns two widgets of the Premium Analytics dashboard, built here with wp-build against the dashboard's SDK (`@automattic/jetpack-premium-analytics-sdk`) and registered when the dashboard's widget registry hydrates: Top videos (`widgets/top-videos/`, `videopress/top-videos`), which the registrant also seeds into the Traffic section's default layout, and the video player (`widgets/video-player/`, `videopress/video-player`), which the dashboard's video report composes.

The package decides nothing about who gets the widgets. `Initializer` calls `Analytics_Dashboard::init()` where VideoPress is active outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes VideoPress. Both are inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

videopress is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

