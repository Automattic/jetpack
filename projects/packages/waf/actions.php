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
 * Triggers when the Jetpack plugin is updated
 */
add_action(
	'upgrader_process_complete',
	array( __NAMESPACE__ . '\Waf_Runner', 'update_rules_if_changed' )
);

/**
 * Cron to update the rules periodically.
 */
add_action( 'jetpack_waf_rules_update_cron', array( __NAMESPACE__ . '\Waf_Runner', 'update_rules_cron' ) );

if ( ! wp_next_scheduled( 'jetpack_waf_rules_update_cron' ) ) {
	wp_schedule_event( time(), 'twicedaily', 'jetpack_waf_rules_update_cron' );
}

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
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

add_action( 'update_option_jetpack_waf_ip_allow_list', array( Waf_Runner::class, 'activate' ), 10, 0 );
add_action( 'update_option_jetpack_waf_ip_block_list', array( Waf_Runner::class, 'activate' ), 10, 0 );
