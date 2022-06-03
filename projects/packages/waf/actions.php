<?php
/**
 * Action Hooks for Jetpack WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Status\Host;

// We don't want to be anything in here outside WP context.
if ( ! function_exists( 'add_action' ) ) {
	return;
}

/**
 * Check if killswitch is defined as true
 */
if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
	return;
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	return;
}

if ( ( new Host() )->is_atomic_platform() ) {
	add_filter(
		'jetpack_get_available_modules',
		function ( $modules ) {
			unset( $modules['waf'] );

			return $modules;
		}
	);
}

/**
 * Triggers when the Jetpack plugin is updated
 */
add_action(
	'upgrader_process_complete',
	array( __NAMESPACE__ . '\Waf_Runner', 'update_rules_if_changed' )
);

/**
 * Cron to update the rules periodically.
 */
if ( Waf_Runner::is_enabled() ) {
	add_action( 'jetpack_waf_rules_update_cron', array( __NAMESPACE__ . '\Waf_Runner', 'update_rules_cron' ) );

	if ( ! wp_next_scheduled( 'jetpack_waf_rules_update_cron' ) ) {
		wp_schedule_event( time(), 'twicedaily', 'jetpack_waf_rules_update_cron' );
	}
}

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugins_loaded',
	function () {
		require_once __DIR__ . '/run.php';
	}
);

/**
 * Adds the REST API endpoints used by the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'rest_api_init',
	function () {
		require_once __DIR__ . '/src/class-waf-endpoints.php';
		Waf_Endpoints::register_endpoints();
	}
);

add_action( 'update_option_' . Waf_Runner::IP_ALLOW_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
add_action( 'update_option_' . Waf_Runner::IP_BLOCK_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
add_action( 'update_option_' . Waf_Runner::IP_LISTS_ENABLED_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
