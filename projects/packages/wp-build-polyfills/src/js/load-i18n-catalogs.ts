/**
 * Shared translation bootstrap for wp-build dashboards.
 *
 * The wp-build (esbuild) pipeline externalizes `@wordpress/i18n` to the shared
 * `window.wp.i18n` singleton but never wires up loading of the translation
 * catalog, and WordPress core (before 7.0's script-module i18n) has no
 * `wp_set_script_translations()` equivalent for script modules. Each dashboard
 * registers a boot init module that calls this helper; boot awaits init
 * modules before rendering routes, so catalogs install before any translated
 * string evaluates.
 *
 * The set of bundles to load catalogs for comes from the `i18n-manifest.json`
 * that the `stamp-textdomains` build step emits into the build/ directory —
 * the list of every emitted bundle (routes, scripts, modules, widgets) that
 * carries gettext calls. Deriving the list from the build output keeps
 * lazy-loaded bundles covered without each dashboard hand-maintaining a list
 * that drifts as routes and widgets are added. (Dev `wp-build --watch` skips
 * the stamp step, so there is no manifest and the UI falls back to English —
 * same caveat as the stamping itself.)
 *
 * Only route/script/module catalogs are downloaded at boot, through a small
 * concurrency-limited queue so the burst cannot starve the origin and stall
 * the dashboard's own requests behind it. Widget bundles (`build/widgets/**`)
 * are not requested at boot at all: a dashboard with dozens of widgets
 * (Premium Analytics has ~40, two bundles each) must not pay one HTTP request
 * per widget for widgets that may never render. Their catalogs load on demand
 * via `loadBundleI18nCatalog()`, which the dashboard calls as part of
 * importing a widget's module.
 *
 * Relies on `wp.jpI18nLoader` (jetpack-assets package, classic script
 * `wp-jp-i18n-loader`), which hashes a bundle's plugin-relative path the way
 * WordPress names JS translation files, fetches the catalog, and installs it
 * via `setLocaleData()`.
 *
 * Once Jetpack's WP floor reaches 7.0, `wp_set_script_module_translations()`
 * can likely replace this helper along with the build-time text-domain stamp.
 */

interface JpI18nLoader {
	state?: {
		locale?: string;
	};
	downloadI18n(
		path: string,
		domain: string,
		location: 'plugin' | 'theme' | 'core'
	): Promise< void >;
}

/**
 * How long the boot init module may block first render waiting on translation
 * downloads. Past this, rendering proceeds in English and any late catalogs
 * still install in the background (affecting subsequently rendered strings).
 */
const CATALOG_TIMEOUT_MS = 5000;

/**
 * Cap on catalog downloads in flight at once. Sized to keep the origin
 * responsive: on HTTP/2 the browser happily multiplexes the whole manifest
 * (100+ requests on Premium Analytics) in one burst, and a slow origin then
 * serves nothing else — REST calls and lazy route modules queue behind
 * catalogs — until the burst drains.
 */
const MAX_CONCURRENT_DOWNLOADS = 6;

/**
 * How long a download may hold its concurrency slot before the slot is
 * returned to the pool. `downloadI18n()` awaits a bare `fetch` with no timeout
 * and takes no `AbortSignal`, so a stalled origin never settles it and the
 * callers' own bounds unblock only themselves — without this, six stalled
 * downloads wedge the queue for the rest of the page. Set well above both
 * caller bounds (5s, and 15s for the metadata preload) so a merely slow origin
 * never trips it: this bound exists for deadlock-immunity, not responsiveness.
 * The orphaned request keeps running, so in-flight downloads can transiently
 * exceed the cap — which only happens once the origin has stopped answering.
 */
const SLOT_TIMEOUT_MS = 30000;

/**
 * Bundles whose catalogs are left to on-demand loading: the widget tree, one
 * directory below the build root (`build/widgets/…`). Anchored rather than a
 * bare `/widgets/` substring so a route or module that happens to be *named*
 * `widgets` (`build/routes/widgets/content.js`) is still downloaded at boot —
 * nothing would load its catalog later, since the on-demand callers derive
 * `build/widgets/<name>/<file>.js` paths of their own. The leading segment is
 * matched loosely because it is the build directory's own name.
 */
const WIDGET_BUNDLE_PATH = /^[^/]+\/widgets\//;

/**
 * State shared across every inlined copy of this module. wp-build bundles each
 * entry point separately, so the boot init module and a route bundle calling
 * `loadBundleI18nCatalog()` hold *different copies* of this file — plain
 * module-level state would not be shared between them. Parking the state on
 * `window` gives all copies the same manifest cache, download dedupe map, and
 * concurrency queue.
 */
interface SharedCatalogState {
	/** Per-domain manifest bundle set, keyed by text domain. */
	manifests: Map< string, Promise< Set< string > > >;
	/** Settled-once download per `domain|path`, so repeat requests reuse it. */
	downloads: Map< string, Promise< void > >;
	/** Downloads currently in flight. */
	active: number;
	/** Downloads waiting for a free slot. */
	queue: Array< () => void >;
}

/**
 * State private to this copy of the module, used only when the window slot
 * holds a shape this copy doesn't recognize.
 */
let unsharedState: SharedCatalogState | undefined;

/**
 * A fresh, empty shared state.
 *
 * @return The new state.
 */
function newCatalogState(): SharedCatalogState {
	return { manifests: new Map(), downloads: new Map(), active: 0, queue: [] };
}

/**
 * Whether a value parked on `window` is state this copy of the module can use.
 *
 * @param value - Whatever the window slot holds.
 * @return Whether it matches `SharedCatalogState`.
 */
function isCatalogState( value: unknown ): value is SharedCatalogState {
	const state = value as Partial< SharedCatalogState > | null;
	return (
		!! state &&
		state.manifests instanceof Map &&
		state.downloads instanceof Map &&
		typeof state.active === 'number' &&
		Array.isArray( state.queue )
	);
}

/**
 * Fetch (lazily creating) the window-parked shared state.
 *
 * The window slot is one global name shared by every copy of this module on the
 * page, including copies from other plugins built at other versions — so what
 * it holds is not guaranteed to be a shape this copy understands. Using a
 * foreign shape blind would throw out of `manifests.get()`, and since the init
 * modules that call `loadI18nCatalogs()` are awaited by boot without a catch,
 * that surfaces as a blank dashboard rather than an untranslated one.
 *
 * @return The shared catalog state.
 */
function sharedState(): SharedCatalogState {
	const host = window as typeof window & {
		__jetpackWpBuildI18nCatalogs?: unknown;
	};
	const parked = host.__jetpackWpBuildI18nCatalogs;
	if ( parked === undefined ) {
		const state = newCatalogState();
		host.__jetpackWpBuildI18nCatalogs = state;
		return state;
	}
	if ( isCatalogState( parked ) ) {
		return parked;
	}
	// Fall back to state private to this copy rather than replacing what's
	// parked: the copy that put it there is still using it, and each copy
	// overwriting the other's on every call would leave neither with a usable
	// dedupe map. Unshared state costs a few repeat downloads per page and
	// splits the concurrency budget between the copies; both are cheaper than
	// the alternatives.
	if ( ! unsharedState ) {
		warn(
			'Shared catalog state on window has an unrecognized shape; downloads will not be deduped across module copies.'
		);
		unsharedState = newCatalogState();
	}
	return unsharedState;
}

/**
 * Run a download task once a concurrency slot is free, releasing the slot when
 * the task settles or when it has held the slot past `SLOT_TIMEOUT_MS`.
 *
 * @param state - The shared catalog state.
 * @param path  - Package-relative bundle path, for the watchdog's diagnostic.
 * @param task  - The task to run.
 * @return Resolves/rejects with the task once it has run.
 */
function throttled(
	state: SharedCatalogState,
	path: string,
	task: () => Promise< void >
): Promise< void > {
	return new Promise( resolve => {
		const run = () => {
			state.active++;
			let released = false;
			// Whichever of the two paths fires first frees the slot; the guard
			// keeps the other from decrementing `active` a second time, which
			// would let later bursts run over the concurrency cap.
			const release = () => {
				if ( released ) {
					return;
				}
				released = true;
				clearTimeout( watchdog );
				releaseSlot( state );
			};
			const watchdog = setTimeout( () => {
				warn(
					`Catalog download for ${ path } has held a slot for ${ SLOT_TIMEOUT_MS }ms; releasing it so queued downloads can proceed.`
				);
				release();
			}, SLOT_TIMEOUT_MS );
			// Browsers return an opaque handle and stop timers at teardown, but
			// this module is imported directly under `node --test`, where a
			// pending timer keeps the process alive — a stalled download would
			// hold a test run open for the whole timeout. Harmless where absent.
			( watchdog as unknown as { unref?: () => void } ).unref?.();
			// `resolve()` adopts the task's promise, so a rejection still
			// reaches the caller.
			resolve( task().finally( release ) );
		};
		if ( state.active < MAX_CONCURRENT_DOWNLOADS ) {
			run();
		} else {
			state.queue.push( run );
		}
	} );
}

/**
 * Free a concurrency slot and start the next queued download, if any.
 *
 * @param state - The shared catalog state.
 */
function releaseSlot( state: SharedCatalogState ): void {
	state.active--;
	const next = state.queue.shift();
	if ( next ) {
		next();
	}
}

/**
 * Download and install one bundle's catalog, at most once per page. A 404
 * means no catalog exists for this locale/build — the expected English
 * fallback, kept silent. Any other failure (another HTTP status, loader state
 * not set, malformed catalog JSON) is a real misconfiguration worth surfacing,
 * but must never block the render, so the returned promise always resolves.
 *
 * @param loader - The `wp.jpI18nLoader` instance.
 * @param state  - The shared catalog state.
 * @param domain - The package text domain.
 * @param path   - Package-relative bundle path.
 * @return Resolves once the download settles (or is found already requested).
 */
function downloadOnce(
	loader: JpI18nLoader,
	state: SharedCatalogState,
	domain: string,
	path: string
): Promise< void > {
	const key = `${ domain }|${ path }`;
	let download = state.downloads.get( key );
	if ( ! download ) {
		download = throttled( state, path, () => loader.downloadI18n( path, domain, 'plugin' ) ).catch(
			( error: unknown ) => {
				const message = errorMessage( error );
				if ( ! isMissingCatalog( message ) ) {
					warn( `Failed to load "${ domain }" catalog (${ path }): ${ message }` );
				}
			}
		);
		state.downloads.set( key, download );
	}
	return download;
}

/**
 * Log an i18n bootstrap diagnostic. Untranslated-UI failures are otherwise
 * invisible — everything here intentionally falls back to English — so the
 * unexpected paths get a console breadcrumb.
 *
 * @param message - Description of what failed.
 */
function warn( message: string ): void {
	// eslint-disable-next-line no-console
	console.warn( `[jetpack-i18n] ${ message }` );
}

/**
 * Message of an unknown thrown value.
 *
 * @param error - Whatever was thrown.
 * @return Its message text.
 */
function errorMessage( error: unknown ): string {
	return error instanceof Error ? error.message : String( error );
}

/**
 * Whether a failure is the expected "this build has no catalog for this
 * locale" case: a 404. `downloadI18n()` rejects with
 * `HTTP request failed: <status> <statusText>` and `fetchManifest()` mirrors
 * that format, so the status is read back out of the message. Any other status
 * — a 403 from a hardened languages directory, a 500 from the origin — means
 * the catalog may well exist and something is in the way, which is exactly the
 * class of failure that otherwise ships as a silently English UI.
 *
 * @param message - Message of the rejection.
 * @return Whether the failure should be kept silent.
 */
function isMissingCatalog( message: string ): boolean {
	const match = /^HTTP request failed: (\d+)\b/.exec( message );
	return match !== null && match[ 1 ] === '404';
}

/**
 * Fetch the bundle list from the build's i18n manifest.
 *
 * @param moduleUrl - `import.meta.url` of the calling init module. wp-build
 *                  emits init bundles at `build/modules/<pkg>/index(.min).js`,
 *                  so the manifest is two levels up at
 *                  `build/i18n-manifest.json`.
 * @return Package-relative paths of the string-bearing bundles.
 */
async function fetchManifest( moduleUrl: string ): Promise< string[] > {
	const manifestUrl = new URL( '../../i18n-manifest.json', moduleUrl );
	// The module's query is its own content hash, which doesn't change when
	// only the manifest does — so it can't act as a cache-buster on its own.
	// Carry it over for CDN-side variance, and use `no-cache` so the browser
	// revalidates against the server instead of trusting a long-lived cache.
	manifestUrl.search = new URL( moduleUrl ).search;

	const res = await fetch( manifestUrl, { cache: 'no-cache' } );
	if ( ! res.ok ) {
		throw new Error( `HTTP request failed: ${ res.status } ${ res.statusText }` );
	}
	const data = ( await res.json() ) as { bundles?: unknown };
	return Array.isArray( data?.bundles )
		? data.bundles.filter( ( b ): b is string => typeof b === 'string' )
		: [];
}

/**
 * Download and install the JS translation catalogs for a dashboard.
 *
 * Resolves once the route/script/module catalogs are installed, when anything
 * fails (missing manifest or catalogs fall back to English), or after a
 * bounded wait — a stalled network must not wedge first render. Widget
 * catalogs (`<build>/widgets/**`) are not requested here at all; they load
 * through `loadBundleI18nCatalog()` when a widget's module is imported.
 *
 * @param domain    - The package text domain the catalogs are registered under.
 * @param moduleUrl - `import.meta.url` of the calling init module; used to locate the build's i18n manifest.
 * @param timeoutMs - Maximum time to block before resolving anyway.
 */
export async function loadI18nCatalogs(
	domain: string,
	moduleUrl: string,
	timeoutMs: number = CATALOG_TIMEOUT_MS
): Promise< void > {
	const loader = ( window as typeof window & { wp?: { jpI18nLoader?: JpI18nLoader } } ).wp
		?.jpI18nLoader;

	if ( ! loader || typeof loader.downloadI18n !== 'function' ) {
		// The dashboard PHP always enqueues `wp-jp-i18n-loader`; if it's missing
		// every string silently renders untranslated — the hardest failure mode
		// to diagnose. Surface it rather than falling back without a trace.
		warn( `wp.jpI18nLoader unavailable; "${ domain }" strings will render untranslated.` );
		return;
	}

	if ( loader.state?.locale === 'en_US' ) {
		// Default locale needs no catalogs; skip the manifest fetch entirely.
		return;
	}

	const state = sharedState();

	const load = async () => {
		// Fetched at most once per domain per page: the manifest is a static
		// build artifact, and a repeat call must not be able to replace a good
		// bundle set with the empty one a failed refetch yields — every widget
		// loading after that would quietly skip its catalog.
		let manifest = state.manifests.get( domain );
		if ( ! manifest ) {
			// A missing manifest (dev watch build) 404s — expected, kept silent.
			// Anything else is surfaced.
			manifest = fetchManifest( moduleUrl )
				.catch( ( error: unknown ) => {
					const message = errorMessage( error );
					if ( ! isMissingCatalog( message ) ) {
						warn( `Failed to load the i18n manifest for "${ domain }": ${ message }` );
					}
					return [] as string[];
				} )
				.then( bundles => new Set( bundles ) );
			// Published for `loadBundleI18nCatalog()` before it resolves, so an
			// on-demand request never races the manifest fetch.
			state.manifests.set( domain, manifest );
		}

		const blocking: Promise< void >[] = [];
		for ( const path of await manifest ) {
			if ( WIDGET_BUNDLE_PATH.test( path ) ) {
				// Widget catalogs load on demand, when the widget's own module
				// is imported — see `loadBundleI18nCatalog()`.
				continue;
			}
			blocking.push( downloadOnce( loader, state, domain, path ) );
		}
		await Promise.all( blocking );
	};

	let timer: ReturnType< typeof setTimeout > | undefined;
	let settled = false;
	try {
		await Promise.race( [
			load().finally( () => {
				settled = true;
			} ),
			new Promise< void >( resolve => {
				timer = setTimeout( resolve, timeoutMs );
			} ),
		] );
	} catch ( error ) {
		// Every failure path above resolves to English on its own, so this
		// should not fire. Catch anyway so the "never rejects" contract holds
		// structurally: boot awaits the init modules that call this without a
		// catch of its own, and a rejection escaping here blanks the dashboard.
		warn( `Unexpected failure loading "${ domain }" catalogs: ${ errorMessage( error ) }` );
		return;
	} finally {
		clearTimeout( timer );
	}
	if ( ! settled ) {
		warn(
			`"${ domain }" catalog downloads still pending after ${ timeoutMs }ms; rendering may start untranslated.`
		);
	}
}

/**
 * Download and install one bundle's translation catalog on demand.
 *
 * The complement of `loadI18nCatalogs()` for lazy-loaded bundles: call it as
 * part of dynamically importing the bundle (e.g. a dashboard widget's render
 * module), so a catalog is only ever requested for a bundle actually being
 * loaded. Requires `loadI18nCatalogs()` to have run for the domain — that call
 * caches the build's manifest; without it (dev watch build, default locale,
 * loader missing) this resolves immediately and the bundle falls back to
 * English. Bundles the manifest doesn't list carry no strings and are skipped
 * without a request. Repeat calls for the same bundle reuse the first
 * download.
 *
 * Resolves once the catalog is installed, when anything fails (missing
 * catalogs fall back to English), or after a bounded wait — a stalled network
 * must not wedge the caller's import.
 *
 * @param domain     - The package text domain the catalog is registered under.
 * @param bundlePath - Package-relative path of the bundle (as listed in the build's i18n manifest).
 * @param timeoutMs  - Maximum time to block before resolving anyway.
 */
export async function loadBundleI18nCatalog(
	domain: string,
	bundlePath: string,
	timeoutMs: number = CATALOG_TIMEOUT_MS
): Promise< void > {
	const loader = ( window as typeof window & { wp?: { jpI18nLoader?: JpI18nLoader } } ).wp
		?.jpI18nLoader;

	// Boot already warned about a missing loader; stay quiet here.
	if ( ! loader || typeof loader.downloadI18n !== 'function' ) {
		return;
	}

	if ( loader.state?.locale === 'en_US' ) {
		return;
	}

	const state = sharedState();
	const manifest = state.manifests.get( domain );
	if ( ! manifest ) {
		// `loadI18nCatalogs()` never ran for this domain (dev watch build, or
		// called out of order) — the expected English fallback.
		return;
	}

	const load = async () => {
		const bundles = await manifest;
		if ( ! bundles.has( bundlePath ) ) {
			// The bundle carries no gettext calls; there is no catalog to fetch.
			return;
		}
		await downloadOnce( loader, state, domain, bundlePath );
	};

	let timer: ReturnType< typeof setTimeout > | undefined;
	let settled = false;
	try {
		await Promise.race( [
			load().finally( () => {
				settled = true;
			} ),
			new Promise< void >( resolve => {
				timer = setTimeout( resolve, timeoutMs );
			} ),
		] );
	} catch ( error ) {
		// As in `loadI18nCatalogs()`: callers chain the bundle's own import off
		// this promise, so a rejection would leave the bundle unimported rather
		// than untranslated.
		warn(
			`Unexpected failure loading the "${ domain }" catalog for ${ bundlePath }: ${ errorMessage(
				error
			) }`
		);
		return;
	} finally {
		clearTimeout( timer );
	}
	if ( ! settled ) {
		warn(
			`"${ domain }" catalog for ${ bundlePath } still pending after ${ timeoutMs }ms; rendering may start untranslated.`
		);
	}
}
