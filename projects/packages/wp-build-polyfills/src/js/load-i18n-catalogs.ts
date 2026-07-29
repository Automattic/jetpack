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
 * Fetch (lazily creating) the window-parked shared state.
 *
 * @return The shared catalog state.
 */
function sharedState(): SharedCatalogState {
	const host = window as typeof window & {
		__jetpackWpBuildI18nCatalogs?: SharedCatalogState;
	};
	host.__jetpackWpBuildI18nCatalogs ??= {
		manifests: new Map(),
		downloads: new Map(),
		active: 0,
		queue: [],
	};
	return host.__jetpackWpBuildI18nCatalogs;
}

/**
 * Run a download task once a concurrency slot is free.
 *
 * @param state - The shared catalog state.
 * @param task  - The task to run.
 * @return Resolves/rejects with the task once it has run.
 */
function throttled( state: SharedCatalogState, task: () => Promise< void > ): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		const run = () => {
			state.active++;
			task().then(
				value => {
					releaseSlot( state );
					resolve( value );
				},
				error => {
					releaseSlot( state );
					reject( error );
				}
			);
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
		download = throttled( state, () => loader.downloadI18n( path, domain, 'plugin' ) ).catch(
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
 * catalogs are downloaded in the background and never awaited.
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
		// A missing manifest (dev watch build) 404s — expected, kept silent.
		// Anything else is surfaced.
		const manifest = fetchManifest( moduleUrl )
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

		const blocking: Promise< void >[] = [];
		for ( const path of await manifest ) {
			if ( path.includes( '/widgets/' ) ) {
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
	} finally {
		clearTimeout( timer );
	}
	if ( ! settled ) {
		warn(
			`"${ domain }" catalog for ${ bundlePath } still pending after ${ timeoutMs }ms; rendering may start untranslated.`
		);
	}
}
