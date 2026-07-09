<?php
/**
 * Feature Catalog loader for the Jetpack plugin.
 *
 * Registration is distributed: each bundled module declares its own feature(s) in
 * modules/<module>/features.php. This loader discovers and requires them on the
 * jetpack_features_register hook. Features owned by OTHER plugins (Boost, Protect, …)
 * register themselves from those plugins on the same hook — not here.
 *
 * @package automattic/jetpack
 */

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'Automattic\Jetpack\Features\register_feature' ) ) {
			return;
		}
		foreach ( glob( __DIR__ . '/modules/*/features.php' ) as $file ) {
			require_once $file;
		}
	}
);
