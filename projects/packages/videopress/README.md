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

## Library interaction metrics

`jetpack_videopress_library_interaction` describes committed library view changes. Its `interaction` is `view`, `sort`, `filter`, or `search`. View events include `view_type: grid | table`; sort events include `field: title | filename | uploadDate` and `direction: asc | desc`. Filter events include `field: type | privacy | uploadDate` and `action: applied | cleared`. Search events include only `action: applied | cleared`, after the trimmed search has stayed unchanged for 500 ms. No search text, query hashes, filter values/dates, content, filenames or identifiers are added to the event.

Initial/restored preferences, equivalent rerenders, pagination, page size, column visibility and density changes do not emit events. Filter reordering and duplicates do not inflate counts. Each changed filter field emits once, so clearing several filters is several events, not one gesture. Search edits abandoned or reverted before the quiet period, including navigation away, are omitted. React effects run after the view commits and do not put analytics in a state updater.

These events measure use of library controls, not successful result retrieval, unique users, completed video actions or persistent preference writes. View events count switches, not total grid/table usage. They use the existing analytics transport and controls; runtime host eligibility, consent/opt-out, delivery and warehouse coverage still need validation before reporting.

## Development

Build all bundles

```cli
jetpack build packages/videopress
```

Build in watching dog mode 🐕

```cli
jetpack watch packages/videopress
```

## Chapter-save metrics

`jetpack_videopress_chapters_saved` measures acknowledged writes of the automatically generated player chapter track. It emits once after a nonempty filename response from track upload, with `chapter_count` equal to the validated generated chapter count. An acknowledged removal of an existing generated track emits zero. Invalid descriptions with no track, protected manual tracks, failed requests, and missing acknowledgments emit nothing. Saving description text alone is not this outcome.

`source` identifies `dashboard_details`, `dashboard_editor`, `block_editor`, or `upload_details`. These values describe the editing path, not a customer's eligibility or plan. Positive counts can include regenerating the same chapter set after a prose edit; event rows count acknowledged writes, not distinct videos, first adoption, or content changes. The metric does not establish that replication completed or that a viewer used the chapters. Only the existing generated English chapter track is covered; manual VTT uploads and the legacy dashboard remain outside this event.

The existing server track-upload event remains unchanged and covers a different population; do not sum it with this client outcome as separate saves. This event sends no GUID, filename, URL, title, timestamp labels, or description content. It uses existing analytics controls. Host eligibility, opt-out behavior, delivery and warehouse coverage must still be verified before reporting or building customer cohorts.

## Trim and cut metrics

The dashboard editor and block-editor modal record three Tracks events:

- `jetpack_videopress_trim_cut_submitted`: the edit, restore, or retry request returned an identified job for this video. Acceptance is not processing success.
- `jetpack_videopress_trim_cut_submission_failed`: the request rejected, with `reason` limited to `conflict` or `request_error`. A network error does not establish whether the server accepted the request.
- `jetpack_videopress_trim_cut_processed`: the initiating mounted editor observed that job finish, with `outcome` of `complete` or `failed`. Repeated observations emit once per accepted job.

All events include `source` (`dashboard_editor` or `block_editor`) and `action` (`save`, `restore`, or `retry`). Saves also include `has_trim` and `cut_count` (capped at 100, meaning 100 or more). These describe the submitted operations, including previously saved operations retained by this edit, not the number of handle movements or newly added cuts. A save removing every operation has `has_trim=false` and `cut_count=0`. Restore/retry omit these fields because the current draft does not describe the server's restore or retained retry instructions.

Cancel/discard and historical jobs emit nothing. Closing/reloading the editor or losing observation can leave accepted jobs without a recorded outcome; do not treat that gap as failure or use it as a whole-product processing success rate. No extra polling is added. Events contain no video/job identifiers, URLs, content, or timeline timestamps and reuse existing analytics transport. Host eligibility, opt-out behavior and warehouse delivery still need rollout verification before reporting adoption or reliability.

## Dashboard analytics

The existing `jetpack_videopress_admin_page_view` event records one browser page load, including a direct link to a video or its editor. Its `route` property is one of `overview`, `library`, `settings`, `video`, or `video_editor`. It describes the landing route; SPA navigation does not emit additional page views. No video ID, URL, or search text is added.

`is_free` reflects the dashboard's initial `hasVideoPressAccess` value: `true` when access is explicitly false, `false` when access is explicitly true, and omitted when access is unknown. It describes the dashboard access state, not whether the user bought a standalone subscription.

The existing `jetpack_videopress_upgrade_trigger_link_click` event includes `location`: `overview`, `library_at_limit`, or `settings_at_limit` for the corresponding upgrade notice, and `upload_limit` for the upload-intake error notice. The library's upload refusal actions also use `library_at_limit`. These are clicks, not impressions, successful checkouts, or purchases. The pre-connection pricing table uses a separate checkout path and is not covered by these locations.

Both events reuse the existing analytics transport and identity context. Consumers must verify the deployed version, host tracking controls, delivery, and property availability before comparing surfaces or building a funnel; older events lack the new properties.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Premium Analytics dashboard

The package owns two widgets of the Premium Analytics dashboard, built here with wp-build against the dashboard's SDK (`@automattic/jetpack-premium-analytics-sdk`) and registered when the dashboard's widget registry hydrates: Top videos (`widgets/top-videos/`, `videopress/top-videos`), which the registrant also seeds into the Traffic section's default layout, and the video player (`widgets/video-player/`, `videopress/video-player`), which the dashboard's video report composes.

The package decides nothing about who gets the widgets. `Initializer` calls `Analytics_Dashboard::init()` where VideoPress is active outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes VideoPress. Both are inert on a site without the dashboard.

## Caption save metrics

`jetpack_videopress_captions_saved` records acknowledged writes from the caption manager with `track_count: 1`, `is_auto: false`, and a bounded `action`: `draft`, `publish`, or `file_upload`. A draft is an editable WordPress record; it does not make captions available to viewers. Publish and file-upload events require the track endpoint's nonempty filename acknowledgment. Publishing emits once for that upload, even when subsequent old-track cleanup or saving the editable copy fails; the editable copy does not generate a second save event.

Count these as track writes, not unique videos, users, captioned-video inventory, or net additions. Repeated saves and replacements each count. Only captions and subtitles are included. `is_auto: false` identifies these manual author actions, including editing a generated track into a manual copy; it does not classify how an uploaded file was originally authored. Automatic speech-generation jobs, other upload paths, viewer playback, and downstream replication are outside this coverage. Preserve existing server track events and do not sum them with this client event as distinct saves.

The event uses the existing analytics transport and controls, with no new GUID, language, filename, label, caption text, or URL properties. Runtime host eligibility, consent/opt-out behavior, delivery, and warehouse coverage dates still require validation before reporting adoption.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

videopress is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
