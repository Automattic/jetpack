# admin-ui

Generic Jetpack wp-admin UI elements
## How to use
### Menu Registration

Use the Admin_Menu class to add your plugin under the Jetpack top level menu in WP-Admin.

This package will make sure to register the top level menu, if not registered yet, and will add the new menu(s) item(s) under it.

Use the `add_menu` to register your menu, no need to do it inside the `admin_menu` hook. You can do it in your plugin initialization.

The parameters this method gets are the same parameters `add_submenu_page` gets, except that you don't need to inform `parent` menu.

Example:

```PHP
use Automattic\Jetpack\Admin_UI\Admin_Menu;

$page_suffix = Admin_Menu::add_menu(
	__( 'My Awesome plugin', 'my-awesome-plugin' ),
	__( 'My Awesome plugin', 'my-awesome-plugin' ),
	'manage_options',
	'my-awesome-plugin',
	'__my_plugin_page_callback'
);
add_action( 'load-' . $page_suffix, 'my_plugin_do_stuff_on_page_load' );

```

### Menu visibility

An item can declare what gates it, so that turning its feature off removes it from the sidebar. Pass the declaration as the seventh argument:

```PHP
Admin_Menu::add_menu(
	'Jetpack Search',
	'Search',
	'manage_options',
	'jetpack-search',
	array( $this, 'render' ),
	null,
	array(
		'product' => 'search',
		'key'     => 'jetpack-search',
	)
);
```

| Key | Meaning |
| -- | -- |
| `product` | A My Jetpack product slug — the products with cards on the My Jetpack page. Preferred, and covers most items. |
| `module` | A Jetpack module name. Only for items with no product behind them. |
| `key` | The name a host uses for this item in the filter below. Declare one on every item. Falls back to the menu slug when absent. |

**Prefer `product`.** A product is not the same thing as a plugin. It may be gated by a Jetpack module, by a standalone plugin, or by either:

| Gated by | Example products |
| -- | -- |
| A Jetpack module | Stats, Forms, Newsletter, AI |
| A standalone plugin | Boost, Akismet, CRM |
| Either — the standalone plugin when it's installed, the module otherwise | Social, Search, VideoPress, Backup, Protect |
| The Jetpack plugin alone, because the product has no module of its own | Scan |

The product's `is_activated()` already knows which of those applies, so a registration site names the product and never has to work out which kind it is. It asks only whether the site has switched the product on, never whether it has a plan: a lapsed plan keeps the item, so the route back to upgrading survives, and resolving a gate never makes a request to WordPress.com.

Reach for `module` only when a sidebar item has no product class at all. SEO is the example: it's gated by the `seo-tools` module and has no My Jetpack card, so there's no product to name. An item that declares neither is always shown.

A name this site has no module for cannot be answered, so it keeps the item rather than removing it — a typo in a gate is inert. Off the Jetpack plugin that covers any module a standalone plugin has not declared through `jetpack_get_available_standalone_modules`, so declare one there before expecting a `module` gate to do anything.

A `module` gate reads `Modules::is_active()`, which always answers true on WordPress.com Simple, so gates there never remove anything. Hosts on Simple shape the sidebar through the filter below.

**Always declare a `key`**, as a fixed string rather than a reference to the page's slug constant, so renaming a page never renames what hosts have written into their filters.

Everything fails open. An item that declares no gate, a gate naming a product that isn't registered, and a site where My Jetpack didn't initialize all leave the item in place, so declaring a gate can only ever remove an item deliberately.

Declaring a gate is a commitment that the page renders something sensible when the gate is unsatisfied, because a host can force it visible anyway — see below.

### Host control

Hosts shape the sidebar with one of two filters:

* **`jetpack_feature_policy`**, from the `status` package, covers the sidebar, the My Jetpack Features page, and module activation together. It matches a sidebar item by its key or by the product or module it declares. Most hosts want this one. It runs after the filter below and overrides it, provided its callback is added before the admin menu is built.
* **`jetpack_admin_menu_visibility`** governs the sidebar alone. Use it when nothing but the sidebar should change.

`jetpack_admin_menu_visibility` filters a map of item key to state, and passes the registered items for context. Absent keys stay `default`.

| State | Meaning |
| -- | -- |
| `default` | Show the item if its gate is satisfied. What every item does unless a host says otherwise. |
| `visible` | Show the item whatever its gate says. |
| `hidden` | Keep the item out whatever its gate says. |

Every state governs the sidebar entry only. An item that is hidden, or whose gate is unsatisfied, still registers its page, so `admin.php?page=…` keeps working for My Jetpack's Manage buttons, bookmarks, and support links.

The filter runs on `admin_menu` at priority 1000, and can run twice in one request (once for the Jetpack menu, once for top level pages), so add it earlier (from an mu-plugin or a plugin) and keep the callback free of side effects. In network admin it runs once, on `network_admin_menu`, for the Jetpack menu only, so top level keys have no effect there. `Admin_Menu::VISIBILITY_VISIBLE` and `Admin_Menu::VISIBILITY_HIDDEN` hold the same strings as the examples.

#### Keep an entry point for a product the site hasn't turned on

A host that sells Search can keep its page in the sidebar before a site turns Search on, so the page can offer to set it up:

```PHP
add_filter(
	'jetpack_admin_menu_visibility',
	function ( $states ) {
		$states['jetpack-search'] = 'visible';
		return $states;
	}
);
```

#### Hide a product the host doesn't offer

A host that runs its own backups can drop Jetpack's Backup entry:

```PHP
add_filter(
	'jetpack_admin_menu_visibility',
	function ( $states ) {
		$states['jetpack-backup'] = 'hidden';
		return $states;
	}
);
```

That leaves Backup on the My Jetpack Features page. To hide it there too, set the policy instead, before `after_setup_theme`:

```PHP
add_filter(
	'jetpack_feature_policy',
	function ( $policy ) {
		$policy['backup'] = array( 'visibility' => 'hidden' );
		return $policy;
	}
);
```

The whole map is passed at once so two mu-plugins setting different keys merge rather than clobber each other.

#### Item keys

Keys are fixed strings, so they survive a page's slug changing.

| Key | Item |
| -- | -- |
| `jetpack-ai` | Jetpack AI |
| `jetpack-backup` | Backup |
| `jetpack-blaze` | Blaze Ads |
| `jetpack-boost` | Boost |
| `jetpack-forms` | Forms |
| `jetpack-manage` | Jetpack Manage ↗ |
| `jetpack-newsletter` | Newsletter |
| `jetpack-podcast` | Podcast, except on WordPress.com Simple and Atomic sites |
| `jetpack-premium-analytics` | Premium Analytics (top level) |
| `jetpack-protect` | Protect, from the Jetpack plugin or the Protect plugin |
| `jetpack-scan-cloud` | Scan ↗, the link to Jetpack Cloud |
| `jetpack-search` | Search |
| `jetpack-seo` | SEO |
| `jetpack-settings` | Settings |
| `jetpack-social` | Social |
| `jetpack-stats` | Stats, in the Jetpack menu or at the top level |
| `jetpack-subscribers` | Subscribers ↗ |
| `jetpack-videopress` | VideoPress |

Items that declare no key go by their menu slug instead, such as `my-jetpack` and `jetpack-activity-log`. Activity Log can't be filtered on WordPress.com Simple sites.

#### What it isn't for

* **Access control.** `visible` cannot expose a page to someone who lacks the capability for it, because an item is only registered for users who have it. `hidden` doesn't stop anyone opening the page by its URL.
* **Turning a feature off.** A hidden entry leaves its feature running. Use the policy's `activation` to switch off a module, such as Podcast. It can't switch off Backup, which the site's plan decides, or a standalone plugin.
* **Working around a wrong gate.** If an item is missing because Jetpack thinks its product is off when it's on, fix the product's activation check. Forcing the item visible hides the bug from every other place that reads that check.

Only items registered through `Admin_Menu::add_menu()` or `Admin_Menu::add_top_level_menu()` are in the map. Anything added with a bare `add_submenu_page()` or `add_menu_page()` is out of this filter's reach.

### Top level pages

A few Jetpack pages deliberately sit outside the Jetpack menu. `add_top_level_menu()` registers those under the same gate, filter and hidden-but-reachable behavior as `add_menu()`. The parameters mirror `add_menu_page()`, with the visibility declaration appended:

```PHP
$page_suffix = Admin_Menu::add_top_level_menu(
	__( 'My Dashboard', 'my-plugin' ),
	__( 'My Dashboard', 'my-plugin' ),
	'manage_options',
	'my-dashboard',
	array( $this, 'render' ),
	'dashicons-chart-bar',
	30,
	array( 'key' => 'jetpack-my-dashboard' )
);
```

A gate removes the item wherever it resolves false, so check it holds in every context that registers the page — a standalone plugin can run without the Jetpack plugin a `product` gate may assume.

Stats and Premium Analytics register this way, under the keys `jetpack-stats` and `jetpack-premium-analytics`.

Unlike `add_menu()`, the page gets neither the core-notice CSS nor the WPDS design tokens; call `Admin_Menu::hide_core_admin_notices()` or `Admin_Menu::enqueue_design_tokens()` on its own `load-` hook for either. Registering only top level items never builds the Jetpack menu.

### Admin shell: page events

With the admin shell on, opening a member doesn't load the page, so work a dashboard does once per page load doesn't run again. The shell dispatches two events on `window` instead:

* `jetpack-admin-shell:page-shown` once a member is on screen and its URL is written, with `detail: { page, previous, firstShow, routeChanged, hiddenFor, stale, url }`. `previous` is the page the shell switched from, or `null` on a page load. `firstShow` is `true` the first time the app renders in this document and `false` when the shell shows an app it kept mounted. `routeChanged` is `true` only when the shell reopened a kept-mounted app at a URL whose query or hash differs from where it was left, such as through a link or Back, so the app's router has already seen a navigation. It is `false` on a first show, on a return to the route the app was left on, and when unsaved changes kept the app where it was. `hiddenFor` is how many milliseconds a kept-mounted app was hidden since its last `page-shown`, and `0` on a first show. `stale` is `true` once that reaches five minutes.
* `jetpack-admin-shell:page-hidden` as a member leaves the screen, with `detail: { page, previous: null, next, firstShow: false, url }`. `next` is the page the shell is switching to. `page` can be a page that never finished rendering, if the user moved on before it did.

Don't pair the two events: a switch dispatches no `page-shown` when another switch overtakes it before its page renders, or when it returns to a page still rendering from an earlier switch. A later `page-shown` can name a page that never rendered as `previous`. If `next` fails to open while the user is still waiting on it, the shell falls back to loading it.

A dashboard that records a Tracks page view when it mounts records it again on `page-shown` for its own page when `firstShow` is `false`: its mount has already counted the first show, and with the shell off every visit is a page load that counts. A dashboard whose router also records a view on each route change skips that replay when `routeChanged` is `true`, since its router has already counted it.
```JS
useEffect( () => {
	const onShown = event => {
		if (
			event.detail?.page === 'my-dashboard' &&
			! event.detail.firstShow &&
			! event.detail.routeChanged
		) {
			recordPageView();
		}
	};
	window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
	return () => window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
}, [] );
```

A hidden dashboard isn't remounted when it's shown again, so data it fetched before it was hidden stays on screen. On `page-shown` for its own page with `stale` set, a dashboard refetches its queries, such as with `queryClient.invalidateQueries()`, rather than remounting.

Neither event fires while the shell is off.

### Admin shell: memory

Every dashboard the shell prewarms or mounts stays in the document until the next page load, since a booted app can't be disposed of. So the shell caps how many dashboards stay live, the one the page loaded included, and once that many are live, opening another dashboard is a normal page load, which frees the rest. A menu link prewarms its dashboard once the pointer rests on it for 100 ms, so sweeping down the menu prewarms nothing, and hovering never spends the last slot, so the dashboard the user clicks next still opens in place. When the browser reports Save-Data, 2 GB of memory or less, or a 2G connection, hovering doesn't prewarm at all, and the dashboard loads on the click. It sizes the limit from the device memory the browser reports: 3 at 2 GB or less, 10 below 8 GB, 6 when the browser doesn't say, and no limit from 8 GB. A site can set it with the `jetpack_admin_shell_max_live_apps` filter:

```PHP
add_filter( 'jetpack_admin_shell_max_live_apps', fn() => 4 );
```

Anything but a positive integer leaves it to the device's memory.

### Admin shell: unsaved changes

With the admin shell on, member dashboards stay mounted while hidden, so switching away keeps an edit. A navigation that would open a member at a different route than where it was left would unmount that view, so first the shell dispatches a cancelable `jetpack-admin-shell:before-leave` event on `window`, with `detail: { page, url }`: the member's admin page slug and the URL about to open.

A member with unsaved changes asks the user and calls `preventDefault()` to stay. The user may be looking at another dashboard, so the question should name the member, such as "You have unsaved changes in Newsletter. Discard them?". A click is then cancelled. Back/Forward can't be, so the shell reopens the member where it was left, in the same history entry. When the shell is off, or an older Admin UI is loaded, nothing dispatches the event.

Past the live-app limit, opening another dashboard loads the page, which would drop every hidden member, so the shell first asks each one the same way, with the URL about to load. If one stays, the click is cancelled, and Back/Forward keeps the visible dashboard in the same history entry. The visible member isn't asked: to it, that's an ordinary page load. A hidden member that also prompts from `beforeunload` should skip that prompt right after it lets a `before-leave` go on, such as with a flag it clears in a `setTimeout`, or the user is asked twice.

```JS
window.addEventListener( 'jetpack-admin-shell:before-leave', event => {
	if ( event.detail?.page === 'my-dashboard' && isDirty && ! window.confirm( message ) ) {
		event.preventDefault();
	}
} );
```

The shell asks before its own navigation, and a screen that also guards `popstate` hears that navigation in the same task: let it skip its own prompt then, so the user is asked once. Such a guard also hears popstates while its page is hidden, so let it stand down from `jetpack-admin-shell:page-hidden` until `jetpack-admin-shell:page-shown` for its page.

### Media library on demand

A dashboard that opens the WordPress media library from one control doesn't need `wp_enqueue_media()` on every page load. Await `loadMediaLibrary()` from `@automattic/jetpack-components` in that control's click handler instead: the first call fetches the media scripts and templates from this package's `jetpack_media_library` admin-ajax action and resolves once `wp.media` is ready, and later calls resolve at once. It rejects when the library can't be loaded, so show the user an error, and a later call tries again. The user needs the `upload_files` capability.

```JS
import { loadMediaLibrary } from '@automattic/jetpack-components/tools/load-media-library';

const onClick = async () => {
	setBusy( true );
	try {
		await loadMediaLibrary();
	} catch {
		showError( __( 'The media library could not be loaded. Try again.' ) );
		return;
	} finally {
		setBusy( false );
	}
	window.wp.media( { title, library: { type: 'image' } } ).open();
};
```

The endpoint must be hooked on admin-ajax requests, which never build the admin menu, so call `Media_Library::init()` from the package's own init. `Admin_Shell::init()` calls it too.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

admin-ui is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

