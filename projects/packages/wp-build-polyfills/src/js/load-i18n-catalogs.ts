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
	// Carry the module's cache-busting query over so long-lived edge caches
	// don't serve a stale manifest across deploys.
	manifestUrl.search = new URL( moduleUrl ).search;

	const res = await fetch( manifestUrl );
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
 * Resolves once the catalogs are installed, when anything fails (missing
 * manifest or catalogs fall back to English), or after a bounded wait — a
 * stalled network must not wedge first render.
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
		// Loader script not on the page; the UI falls back to English.
		return;
	}

	if ( loader.state?.locale === 'en_US' ) {
		// Default locale needs no catalogs; skip the manifest fetch entirely.
		return;
	}

	const load = async () => {
		// A missing manifest (dev watch build, stale deploy) falls back to English.
		const bundles = await fetchManifest( moduleUrl ).catch( () => [] as string[] );
		await Promise.all(
			bundles.map( path =>
				// No-op for en_US; rejects when no catalog exists for this
				// build/locale. Swallow so a missing catalog falls back to English
				// instead of blocking the render.
				loader.downloadI18n( path, domain, 'plugin' ).catch( () => undefined )
			)
		);
	};

	let timer: ReturnType< typeof setTimeout > | undefined;
	try {
		await Promise.race( [
			load(),
			new Promise< void >( resolve => {
				timer = setTimeout( resolve, timeoutMs );
			} ),
		] );
	} finally {
		clearTimeout( timer );
	}
}
