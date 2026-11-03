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

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Premium Analytics dashboard

The package owns two widgets of the Premium Analytics dashboard, built here with wp-build against the dashboard's SDK (`@automattic/jetpack-premium-analytics-sdk`) and registered when the dashboard's widget registry hydrates: Top videos (`widgets/top-videos/`, `videopress/top-videos`), which the registrant also seeds into the Traffic section's default layout, and the video player (`widgets/video-player/`, `videopress/video-player`), which the dashboard's video report composes.

The package decides nothing about who gets the widgets. `Initializer` calls `Analytics_Dashboard::init()` where VideoPress is active outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes VideoPress. Both are inert on a site without the dashboard.

## Browser upload lifecycle analytics

The modern dashboard, video block file uploader, Jetpack's core Video block resumable uploader and Premium Analytics upload widget record the existing specification's `jetpack_videopress_upload_started`, `_succeeded`, `_failed`, `_canceled` and `_retried` names through shared Tracks controls. Their bounded sources are `dashboard`, `block_editor` and `analytics_widget`. The recorder is shared through the `videopress-upload-analytics` subpath of shared-extension-utils. PHP promotion/import and multipart routes remain outside this browser batch.

A random `upload_id` identifies a selected File within its queue/component lifetime. `attempt` starts at one and advances after a reported failure; pause/resume retains that attempt. `sequence` orders observations within the logical upload. Selecting a new File or reloading starts a new identity, including when tus resumes a previous server upload: `retry_type: stored_upload` marks that partial-history case. `network` retries count when a subsequent request starts, `resume` when the UI resumes a pause, and `user` when a failed selection is attempted again. These are not interchangeable with distinct newly uploaded videos.

Started covers token acquisition. Outcomes describe client callbacks: success is the existing server response-header acknowledgment, not transcoding or playback. Only valid eight-character GUIDs are sent; `guid_valid: false` covers malformed nonempty identifiers without collecting that value. Responses missing any required success header do not produce a success event. Failure uses only bounded token/transfer/resume-lookup codes and an optional numeric HTTP status, never raw error text. Progress is client-reported bytes, not independently confirmed durable bytes. `_canceled` has `action: pause`: tus abort preserves resumability and does not imply server deletion. A lost browser without an outcome remains censored.

`file_type` is allowlisted MIME or `other`/`unknown`; filenames, URLs and file contents are excluded from Tracks. Duration is monotonic elapsed milliseconds within the successful attempt, including pauses. Dashboard `is_free` is its known access flag, not a canonical paid/free classification, and `video_count_before` includes the known library count plus queued uploads at selection. Unknown context is omitted; the editor and widget currently omit it. Source and upload ID also enter tus metadata on new server uploads; this does not establish backend persistence or recover original metadata for an already-existing upload.

Missing secure randomness suppresses correlation/events, and analytics exceptions do not interrupt uploads. Existing runtime host/consent controls and transport enrichment still require deployment validation; there is no claim of complete route coverage, server outcomes, warehouse availability or an all-product success rate. Keep server completion events separate from these client outcomes.

### Client-observed readiness

`jetpack_videopress_video_playable` records the first positive MP4 rendition observation after an acknowledged upload on the current page. Dashboard list/detail reads use `jetpack_videopress.has_ready_rendition`; Simple checks canonical completed MP4 formats and other sites check synchronized rendition paths. Modern video metadata requests and legacy editor reads also supply observations. The video API predicate requires both a nonempty MP4 path and that format's `DONE` status. Overall `finished`, duration, thumbnails and UI processing state are not readiness evidence.

The event retains the upload ID, source, attempt and sequence, and emits once per logical browser upload ID. Two selections that resume the same stored server upload can therefore share a GUID; events are not distinct-video counts. `seconds_since_upload` starts at the successful transfer callback (`clock_basis: upload_success_callback`); `seconds_since_upload_started` starts at the successful attempt's start and includes token acquisition and pauses. `readiness_basis: server_reported_mp4` and `observation_source: media_rest|video_api` make the observation explicit. These measure the browser's delayed observation, not backend first-playable time, full processing completion, codec support in a particular browser or a successful CDN fetch.

Existing requests supply the observations; this measurement adds no polling and does not extend the dashboard's poll cap or the editor's metadata retries. A widget that navigates away, hidden library item, page reload, missing identifier or absent ready response can leave an upload unobserved. Page-local correlation is shared across route bundles, expires after 24 hours and retains at most 500 pending uploads (oldest evicted first). No readiness event means unknown/censored, not a failed conversion. These samples alone cannot establish all-upload latency percentiles or the fraction exceeding the poll cap. Deploy and validate host/transport coverage before using them in charts.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

videopress is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

