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
 * Determines if the passed $option is one of the allowed WAF operation modes.
 *
 * @param  string $option The mode option.
 * @return bool
 */
function is_allowed_mode( $option ) {
	$allowed_modes = array(
		'normal',
		'silent',
	);

	return in_array( $option, $allowed_modes, true );
}

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
	function () {

		if ( ! defined( 'JETPACK_WAF_MODE' ) ) {
			$mode_option = get_option( 'jetpack_waf_mode' );

			if ( ! is_allowed_mode( $mode_option ) ) {
				return;
			}

			define( 'JETPACK_WAF_MODE', $mode_option );
		}

		if ( ! is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}

		if ( ! WafRunner::did_run() ) {
			WafRunner::run();
		}
	}
);
