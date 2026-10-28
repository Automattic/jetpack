<?php
/**
 * Translations for mu-wpcom's wp-build pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_wp_build_script_translations' ) ) {
	/**
	 * Inline JS that installs the translation catalogs of a page's wp-build bundles into `wp.i18n`.
	 *
	 * Core's `load_script_textdomain()` on a registered, never-enqueued handle per bundle picks up the
	 * platform filters that point this package's catalogs at `languages/mu-plugins/`, which no URL
	 * serves for the client-side loader the other wp-build dashboards use.
	 *
	 * @param string          $manifest_file Path to the build's `i18n-manifest.json` (from `stamp-textdomains`).
	 * @param string          $build_url     URL of the build directory the bundles are served from.
	 * @param string|string[] $routes        The wp-build route(s) whose bundles to cover, besides the shared modules and scripts.
	 * @param string          $domain        The text domain.
	 * @return string|null The inline script, or null when no bundle has a catalog for this locale.
	 */
	function wpcom_wp_build_script_translations( $manifest_file, $build_url, $routes, $domain = 'jetpack-mu-wpcom' ) {
		if ( ! is_readable( $manifest_file ) ) {
			return null;
		}
		$manifest = json_decode( (string) file_get_contents( $manifest_file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local build artifact.
		$bundles  = is_array( $manifest ) && isset( $manifest['bundles'] ) && is_array( $manifest['bundles'] ) ? $manifest['bundles'] : array();

		$pattern = implode( '|', array_map( static fn( $name ) => preg_quote( $name, '#' ), (array) $routes ) );
		$scripts = array();
		foreach ( $bundles as $index => $bundle ) {
			// The manifest lists paths under the build directory's own name, e.g. `build/routes/x/content.js`.
			if ( ! is_string( $bundle ) || ! preg_match( '#^[^/]+/(routes/(?:' . $pattern . ')|scripts|modules)/#', $bundle ) ) {
				continue;
			}
			$handle = 'wpcom-wp-build-i18n-' . $index;
			wp_register_script( $handle, trailingslashit( $build_url ) . substr( $bundle, strpos( $bundle, '/' ) + 1 ), array(), false, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.NoExplicitVersion -- Never printed; only registered so core can locate its catalog.
			$json = load_script_textdomain( $handle, $domain );
			wp_deregister_script( $handle );
			if ( ! $json ) {
				continue;
			}

			$data     = json_decode( $json, true );
			$messages = $data['locale_data'][ $domain ] ?? $data['locale_data']['messages'] ?? null;
			if ( ! is_array( $messages ) || array() === $messages ) {
				continue;
			}
			// HEX_TAG keeps a literal "</script>" in a translation from closing the inline script tag.
			$scripts[] = 'wp.i18n.setLocaleData( ' . wp_json_encode( $messages, JSON_HEX_TAG | JSON_HEX_AMP ) . ', ' . wp_json_encode( $domain, JSON_HEX_TAG | JSON_HEX_AMP ) . ' );';
		}

		return $scripts ? implode( "\n", $scripts ) : null;
	}
}
