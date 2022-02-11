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

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
	function () {
		$allowed_modes = array(
			'normal',
			'silent',
		);

		$mode_option = get_option( 'jetpack_waf_mode' );

		if ( ! in_array( $mode_option, $allowed_modes, true ) ) {
			return;
		}

		define( 'JETPACK_WAF_MODE', $mode_option );

		if ( ! WafRunner::did_run() ) {
			WafRunner::run();
		}
	}
);
