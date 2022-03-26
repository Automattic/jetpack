<?php
/**
 * Action Hooks for Jetpack WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

// We don't want to be anything in here outside WP context.
if ( ! function_exists( 'add_action' ) ) {
	return;
}

define( 'JETPACK_WAF_VERSION', '1.0.3' );
define( 'JETPACK_WAF_DIR', __DIR__ );
const RULES_FILE = JETPACK_WAF_DIR . '/rules/rules.php';

/**
 * Triggers when the Jetpack plugin is activated
 */
register_activation_hook(
	JETPACK__PLUGIN_FILE,
	// Another way array( __NAMESPACE__ . '\Waf', 'activate' ).
	function () {
		global $wp_filesystem;

		if ( ! function_exists( '\\WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! \WP_Filesystem() ) {
			throw new \Exception( 'No filesystem available' );
		}

		return $wp_filesystem->put_contents( RULES_FILE, '<?php' );
	}
);

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'admin_init',
	function () {
		$version = get_option( 'jetpack_waf_version' );
		if ( ! $version ) {
			add_option( 'jetpack_waf_version', JETPACK_WAF_VERSION );
		}
		if ( JETPACK_WAF_VERSION !== $version ) {
			global $wp_filesystem;

			if ( ! function_exists( '\\WP_Filesystem' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			if ( ! \WP_Filesystem() ) {
				throw new \Exception( 'No filesystem available' );
			}

			$wp_filesystem->put_contents( RULES_FILE, '<?php ' . JETPACK_WAF_VERSION );
		}
		require_once __DIR__ . '/run.php';
	}
);
