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

## Dashboard analytics

The existing `jetpack_videopress_admin_page_view` event records one browser page load, including a direct link to a video or its editor. Its `route` property is one of `overview`, `library`, `settings`, `video`, or `video_editor`. It describes the landing route; SPA navigation does not emit additional page views. No video ID, URL, or search text is added.

`is_free` reflects the dashboard's initial `hasVideoPressAccess` value: `true` when access is explicitly false, `false` when access is explicitly true, and omitted when access is unknown. It describes the dashboard access state, not whether the user bought a standalone subscription.

The existing `jetpack_videopress_upgrade_trigger_link_click` event includes `location`: `overview`, `library_at_limit`, or `settings_at_limit` for the corresponding upgrade notice, and `upload_limit` for the upload-intake error notice. The library's upload refusal actions also use `library_at_limit`. These are clicks, not impressions, successful checkouts, or purchases. The pre-connection pricing table uses a separate checkout path and is not covered by these locations.

Both events reuse the existing analytics transport and identity context. Consumers must verify the deployed version, host tracking controls, delivery, and property availability before comparing surfaces or building a funnel; older events lack the new properties.

`jetpack_videopress_upload_refused` records client-side refusals in `library_dropzone`, `library_intake`, or `onboarding_intake`. `reason` is `file_validation` or `plan_limit`. `files_known` distinguishes file selections from a blocked attempt to open the picker. When files are present, `attempted_files` counts the files received by that handler and `skipped_files` counts only those refused for that reason. A mixed selection can produce one event per reason; do not sum attempted-file counts across those events as unique attempts. Partially accepted selections still upload their accepted files.

The dropzone reports its own validation/limit refusals and passes only accepted files to intake. Files already rejected there do not reach the intake event. A blocked picker click has unknown file counts, never a fabricated zero. Deliberate repeat attempts emit again; rendering a disabled control does not. This measures local decisions, not server failures, completed uploads, unique customers, or every upload surface. Disabled controls that do not dispatch an action, media-library promotion, editor uploads, and the Top videos widget are not covered. The shared dropzone's refusal callback is enabled only for the dashboard Library. No filenames, MIME strings, file contents, or new identifiers are recorded. Runtime delivery and host controls must be verified before reporting these counts.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Premium Analytics dashboard

The package owns two widgets of the Premium Analytics dashboard, built here with wp-build against the dashboard's SDK (`@automattic/jetpack-premium-analytics-sdk`) and registered when the dashboard's widget registry hydrates: Top videos (`widgets/top-videos/`, `videopress/top-videos`), which the registrant also seeds into the Traffic section's default layout, and the video player (`widgets/video-player/`, `videopress/video-player`), which the dashboard's video report composes.

The package decides nothing about who gets the widgets. `Initializer` calls `Analytics_Dashboard::init()` where VideoPress is active outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes VideoPress. Both are inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

videopress is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
