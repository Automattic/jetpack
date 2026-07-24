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
 * Relies on `wp.jpI18nLoader` (jetpack-assets package, classic script
 * `wp-jp-i18n-loader`), which hashes a bundle's plugin-relative path the way
 * WordPress names JS translation files, fetches the catalog, and installs it
 * via `setLocaleData()`.
 *
 * Once Jetpack's WP floor reaches 7.0, `wp_set_script_module_translations()`
 * can likely replace this helper along with the build-time text-domain stamp.
 */

interface JpI18nLoader {
	downloadI18n(
		path: string,
		domain: string,
		location: 'plugin' | 'theme' | 'core'
	): Promise< void >;
}

/**
 * Download and install the JS translation catalogs for a dashboard.
 *
 * @param domain  - The package text domain the catalogs are registered under.
 * @param bundles - Package-relative paths of the built bundles carrying translatable strings. Always the non-min `.js` path — WP keys each catalog on the md5 of the non-minified path.
 */
export async function loadI18nCatalogs( domain: string, bundles: string[] ): Promise< void > {
	const loader = ( window as typeof window & { wp?: { jpI18nLoader?: JpI18nLoader } } ).wp
		?.jpI18nLoader;

	if ( ! loader || typeof loader.downloadI18n !== 'function' ) {
		// The dashboard PHP always enqueues `wp-jp-i18n-loader`; if it's missing
		// (or the classic loader script hasn't run yet) every string silently
		// renders untranslated — the hardest failure mode to diagnose. Surface it
		// rather than falling back to English without a trace.
		// eslint-disable-next-line no-console
		console.warn(
			`[jetpack-i18n] wp.jpI18nLoader unavailable; "${ domain }" strings will render untranslated.`
		);
		return;
	}

	await Promise.all(
		bundles.map( path =>
			// No-op for en_US. An `HTTP request failed:` rejection means no
			// catalog exists for this locale/build — the expected English
			// fallback, kept silent. Any other error (loader state not set,
			// malformed catalog JSON) is a real misconfiguration worth
			// surfacing, but must never block the render.
			loader.downloadI18n( path, domain, 'plugin' ).catch( error => {
				const message = error instanceof Error ? error.message : String( error );
				if ( ! message.startsWith( 'HTTP request failed:' ) ) {
					// eslint-disable-next-line no-console
					console.warn(
						`[jetpack-i18n] Failed to load "${ domain }" catalog (${ path }): ${ message }`
					);
				}
			} )
		)
	);
}
