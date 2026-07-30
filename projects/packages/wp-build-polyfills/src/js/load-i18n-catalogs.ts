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
 * Only route/script/module catalogs are awaited before render. Widget bundles
 * (`build/widgets/**`) are lazy-loaded, so their catalog downloads are kicked
 * off here but not awaited — a dashboard with dozens of widgets (Premium
 * Analytics has ~76) must not block first paint on catalogs for widgets that
 * may never render, and the downloads have until the widget's own dynamic
 * import resolves to arrive.
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

	const download = ( path: string ) =>
		// A 404 means no catalog exists for this locale/build — the expected
		// English fallback, kept silent. Any other failure (another HTTP
		// status, loader state not set, malformed catalog JSON) is a real
		// misconfiguration worth surfacing, but must never block the render.
		loader.downloadI18n( path, domain, 'plugin' ).catch( ( error: unknown ) => {
			const message = errorMessage( error );
			if ( ! isMissingCatalog( message ) ) {
				warn( `Failed to load "${ domain }" catalog (${ path }): ${ message }` );
			}
		} );

	const load = async () => {
		// A missing manifest (dev watch build) 404s — expected, kept silent.
		// Anything else is surfaced.
		const bundles = await fetchManifest( moduleUrl ).catch( ( error: unknown ) => {
			const message = errorMessage( error );
			if ( ! isMissingCatalog( message ) ) {
				warn( `Failed to load the i18n manifest for "${ domain }": ${ message }` );
			}
			return [] as string[];
		} );

		const blocking: Promise< void >[] = [];
		for ( const path of bundles ) {
			const catalog = download( path );
			if ( ! path.includes( '/widgets/' ) ) {
				blocking.push( catalog );
			}
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
