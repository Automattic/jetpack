<?php
/**
 * Tests for the wpcom REST API v2 endpoint loader wiring.
 *
 * Run with: jetpack docker phpunit jetpack -- --filter=Load_Wpcom_Endpoints_Test
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/load-wpcom-endpoints.php';

/**
 * Guards the behaviour that lets the wpcom REST v2 endpoints load lazily on
 * `rest_api_init` instead of on every `plugins_loaded`.
 *
 * @covers ::load_wpcom_rest_api_v2_plugin_files
 */
#[CoversFunction( 'load_wpcom_rest_api_v2_plugin_files' )]
class Load_Wpcom_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The loader runs on `rest_api_init` at priority 5, and each endpoint's
	 * constructor registers `register_routes` on the same action at the default
	 * priority 10. This asserts the WordPress guarantee that makes that work: a
	 * callback added at priority 10 while priority 5 of the same action is running
	 * still fires within that same `do_action()` pass.
	 *
	 * If this ever stopped holding, routes would silently stop registering rather
	 * than failing loudly, so we pin it here.
	 */
	public function test_callback_added_at_higher_priority_during_pass_fires_in_same_pass() {
		$action = 'jetpack_test_deferred_hook_ordering';
		$fired  = array();

		// Priority 5: mimic the loader by registering a callback at the default priority 10.
		add_action(
			$action,
			function () use ( $action, &$fired ) {
				$fired[] = 'loader';
				add_action(
					$action,
					function () use ( &$fired ) {
						$fired[] = 'register_routes';
					},
					10
				);
			},
			5
		);

		do_action( $action );

		$this->assertSame(
			array( 'loader', 'register_routes' ),
			$fired,
			'A callback added at priority 10 during a priority-5 pass of the same action must fire within that same pass; otherwise deferred route registration would break.'
		);
	}

	/**
	 * Regression guard on the hook wiring itself. This asserts the loader is bound
	 * to `rest_api_init` at priority 5 — catching a revert of the priority (which
	 * would run the loader after `register_routes`) or removal of the hook (which
	 * would stop the endpoints loading on REST requests) without relying on any
	 * endpoint's behaviour.
	 */
	public function test_loader_is_hooked_to_rest_api_init_at_priority_5() {
		$this->assertSame(
			5,
			has_action( 'rest_api_init', 'load_wpcom_rest_api_v2_plugin_files' ),
			'wpcom REST v2 endpoints must load on rest_api_init at priority 5, before register_routes runs at the default priority 10.'
		);
	}
}
