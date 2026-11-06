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

The existing `jetpack_videopress_upgrade_trigger_link_click` event includes `location`: `overview`, `library_at_limit`, or `settings_at_limit` for the corresponding upgrade notice, `upload_limit` for the upload-intake error notice, and `pricing_upsell` for the pre-connection pricing table's paid button. The library's upload refusal actions also use `library_at_limit`. These are clicks, not successful checkouts or purchases. The pre-connection free registration button does not emit an upgrade click.

`jetpack_videopress_upsell_impression` records once per mounted surface when an eligible free-tier notice or pre-connection paid button renders. Its `location` uses the same labels except `upload_limit`, whose transient error notice is not counted. Conditional notices and missing pricing data produce no impression until an offer renders. Rerenders, count updates, and StrictMode effect replay do not repeat it; visiting a surface after it unmounts can record another impression. This measures rendered offers, including those outside the viewport or in background tabs, not visibility, attention, or unique people.

Impressions include `video_count_known`. When true, `video_count` is the current UI count after a successful library read, including pending/uploading items. Unknown, failed, or still-loading counts are omitted, not recorded as zero. The first rendered offer keeps the count available at that moment; a later response does not resend it. Pre-connection pricing always reports an unknown count. This is not a lifetime upload total or an authoritative inventory.

All events reuse the existing analytics transport and identity context without adding identifiers or changing host tracking controls. Consumers must verify the deployed version, controls, delivery, and property availability before comparing surfaces or building a funnel; older events lack the new properties. Pre-connection identity and purchase attribution require separate validation. Impression and click totals are repeatable interactions, so their ratio alone is not a user conversion rate.

`jetpack_videopress_upload_refused` records client-side refusals in `library_dropzone`, `library_intake`, or `onboarding_intake`. `reason` is `file_validation` or `plan_limit`. `files_known` distinguishes file selections from a blocked attempt to open the picker. When files are present, `attempted_files` counts the files received by that handler and `skipped_files` counts only those refused for that reason. A mixed selection can produce one event per reason; do not sum attempted-file counts across those events as unique attempts. Partially accepted selections still upload their accepted files.

The dropzone reports its own validation/limit refusals and passes only accepted files to intake. Files already rejected there do not reach the intake event. A blocked picker click has unknown file counts, never a fabricated zero. Deliberate repeat attempts emit again; rendering a disabled control does not. This measures local decisions, not server failures, completed uploads, unique customers, or every upload surface. Disabled controls that do not dispatch an action, media-library promotion, editor uploads, and the Top videos widget are not covered. The shared dropzone's refusal callback is enabled only for the dashboard Library. No filenames, MIME strings, file contents, or new identifiers are recorded. Runtime delivery and host controls must be verified before reporting these counts.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Premium Analytics dashboard

The package owns two widgets of the Premium Analytics dashboard, built here with wp-build against the dashboard's SDK (`@automattic/jetpack-premium-analytics-sdk`) and registered when the dashboard's widget registry hydrates: Top videos (`widgets/top-videos/`, `videopress/top-videos`), which the registrant also seeds into the Traffic section's default layout, and the video player (`widgets/video-player/`, `videopress/video-player`), which the dashboard's video report composes.

The package decides nothing about who gets the widgets. `Initializer` calls `Analytics_Dashboard::init()` where VideoPress is active outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrants on Simple and Atomic where the plan includes VideoPress. Both are inert on a site without the dashboard.

## Dashboard deletion analytics

`jetpack_videopress_video_deleted` records acknowledged deletions from the dashboard Library and video details page. `count` includes only selected items identified as VideoPress videos whose attachment DELETE response explicitly says `deleted: true`. Failed, unconfirmed, and local-video deletions do not contribute. Partial bulk failures still report the acknowledged VideoPress deletions; an empty result emits no event. Sum `count` to count these deletions, rather than counting event rows.

`is_bulk` means the operation requested more than one distinct attachment, including local items or items that subsequently fail. Repeated identities in a selection are requested once. Tracking runs inside the mutation after responses arrive, so rerenders do not repeat it and unmounting does not discard an in-flight result. The event confirms attachment deletion, not remote media erasure or recovered storage. Other WordPress/editor deletion paths are not covered.

No identifiers, titles, filenames, content, or error messages are added. The event reuses the existing analytics transport and host tracking controls. Verify deployed-host delivery and warehouse coverage before reporting adoption or deletion rates; this implementation alone does not establish a reliable reporting start date.

## Media Library upload source

Promoting a local attachment through `/videopress/v1/upload/{id}` sends `source=dashboard_promote` from the VideoPress dashboard and `source=block_editor` from the video block's Media Library picker. Both upload loops retain the optional, bounded value through subsequent chunks, and the PHP uploader forwards it into TUS creation metadata. Other PHP and REST callers remain unlabeled unless they explicitly supply a supported source.

WordPress.com Simple sends the same source labels through its separate `/wpcom/v2/videopress/promote/{id}` route. After verifying a new registration, the endpoint fires `jetpack_videopress_attachment_promoted` with the canonical video, site ID and optional source for server-side consumers. Failed promotions and requests for already-promoted videos do not fire this action.

This identifies the initiating surface, not a new attachment, successful processing or first playability. Simple promotion does not transfer the file again. Already-promoted attachments do not start another transfer, and resumed TUS resources keep their original creation metadata. Server-side persistence and query availability must be verified before using this source in reporting.

## Browser upload lifecycle analytics

The modern dashboard, video block file uploader, Jetpack's core Video block resumable uploader and Premium Analytics upload widget record the existing specification's `jetpack_videopress_upload_started`, `_succeeded`, `_failed`, `_canceled` and `_retried` names through shared Tracks controls. Their bounded sources are `dashboard`, `block_editor` and `analytics_widget`. The recorder is shared through the `videopress-upload-analytics` subpath of shared-extension-utils. PHP promotion/import, multipart routes and client-observed playability remain outside this browser batch.

A random `upload_id` identifies a selected File within its queue/component lifetime. `attempt` starts at one and advances after a reported failure; pause/resume retains that attempt. `sequence` orders observations within the logical upload. Selecting a new File or reloading starts a new identity, including when tus resumes a previous server upload: `retry_type: stored_upload` marks that partial-history case. `network` retries count when a subsequent request starts, `resume` when the UI resumes a pause, and `user` when a failed selection is attempted again. These are not interchangeable with distinct newly uploaded videos.

Started covers token acquisition. Outcomes describe client callbacks: success is the existing server response-header acknowledgment, not transcoding or playback. Only valid eight-character GUIDs are sent; `guid_valid: false` covers malformed nonempty identifiers without collecting that value. Responses missing any required success header do not produce a success event. Failure uses only bounded token/transfer/resume-lookup codes and an optional numeric HTTP status, never raw error text. Progress is client-reported bytes, not independently confirmed durable bytes. `_canceled` has `action: pause`: tus abort preserves resumability and does not imply server deletion. A lost browser without an outcome remains censored.

`file_type` is allowlisted MIME or `other`/`unknown`; filenames, URLs and file contents are excluded from Tracks. Duration is monotonic elapsed milliseconds within the successful attempt, including pauses. Dashboard `is_free` is its known access flag, not a canonical paid/free classification, and `video_count_before` includes the known library count plus queued uploads at selection. Unknown context is omitted; the editor and widget currently omit it. Source and upload ID also enter tus metadata on new server uploads; this does not establish backend persistence or recover original metadata for an already-existing upload.

Missing secure randomness suppresses correlation/events, and analytics exceptions do not interrupt uploads. Existing runtime host/consent controls and transport enrichment still require deployment validation; there is no claim of complete route coverage, server outcomes, warehouse availability or an all-product success rate. Keep server completion events separate from these client outcomes.

## Thumbnail change metrics

`jetpack_videopress_poster_changed` records a confirmed remote thumbnail outcome from the dashboard thumbnail card, with `method: attachment | frame`. Attachment means choosing an image through the media library; it is not necessarily a new upload. Frame selection requires the accepted generation response followed by an explicit `generating: false` result containing a nonempty poster URL different from the one returned when generation was queued. Clearing the generating flag alone is insufficient because failed jobs also clear it. Missing acknowledgments, unchanged frame URLs, and exhausted polling do not count.

The event records before the subsequent local metadata update, so a failure there does not erase the already confirmed remote outcome. It does not measure unique videos, visual differences between images, downstream delivery, or viewer exposure. The poll endpoint has no request-specific completion identity; concurrent edits can affect attribution, and an unchanged URL is conservatively omitted. Other editor/legacy paths and automatic thumbnails are outside coverage.

No GUIDs, attachment IDs, URLs, frame times, filenames or content are added. Existing analytics transport and controls are reused; runtime host eligibility, consent/opt-out, delivery and warehouse coverage still need validation before adoption reporting.

## Playlist publication analytics

The existing `jetpack_videopress_playlist_block_published` and `jetpack_videopress_latest_videos_playlist_block_published` events record an observed manual publication save only after the editor finishes saving, reports success, and exposes a saved `publish` status for the same post. Failed attempts, autosaves, previews, ordinary updates to published posts, and saves already underway when the tracking hook mounts are excluded. Missing required editor selectors or an unknown first block also suppress reporting.

The first block of each type supplies the existing `post_type`, `layout`, `video_count`, and `playlist_count` properties, captured when saving starts. A captured save can finish after that block unmounts or changes; its listener is released on completion or a post-context switch. No post or video identifier is sent. These remain client events subject to the existing Tracks configuration and delivery limitations, not a complete server publication ledger.

The two block types report separately: adding their totals does not count distinct posts. Counts and layout describe the editor snapshot, not server-filtered content; latest-videos membership can also change after publication. Republish operations can count again. Keep pre-fix attempt counts separate from post-rollout acknowledged counts when comparing trends.

## Caption save metrics

`jetpack_videopress_captions_saved` records acknowledged writes from the caption manager with `track_count: 1`, `is_auto: false`, and a bounded `action`: `draft`, `publish`, or `file_upload`. A draft is an editable WordPress record; it does not make captions available to viewers. Publish and file-upload events require the track endpoint's nonempty filename acknowledgment. Publishing emits once for that upload, even when subsequent old-track cleanup or saving the editable copy fails; the editable copy does not generate a second save event.

Count these as track writes, not unique videos, users, captioned-video inventory, or net additions. Repeated saves and replacements each count. Only captions and subtitles are included. `is_auto: false` identifies these manual author actions, including editing a generated track into a manual copy; it does not classify how an uploaded file was originally authored. Automatic speech-generation jobs, other upload paths, viewer playback, and downstream replication are outside this coverage. Preserve existing server track events and do not sum them with this client event as distinct saves.

The event uses the existing analytics transport and controls, with no new GUID, language, filename, label, caption text, or URL properties. Runtime host eligibility, consent/opt-out behavior, delivery, and warehouse coverage dates still require validation before reporting adoption.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

videopress is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
