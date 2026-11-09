<?php
/**
 * Tests for Google_Analytics_Settings.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Google_Analytics_Settings
 */
#[CoversClass( Google_Analytics_Settings::class )]
class Google_Analytics_Settings_Test extends BaseTestCase {

	const ROUTE = '/wp/v2/settings';

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_my-jetpack-settings-consolidation';

	/**
	 * Stand up core's settings route for an administrator on a site with Google Analytics.
	 */
	public function set_up() {
		parent::set_up();

		$GLOBALS['jpa_test_wpcom_features'] = array( 'google-analytics' );
		add_filter( self::FLAG_FILTER, '__return_true' );
		add_filter( 'is_jetpack_site', '__return_true' );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'ga-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		$this->boot_route();
	}

	/**
	 * Drop the options and everything the test hooked up.
	 */
	public function tear_down() {
		delete_option( 'jetpack_wga' );
		delete_option( 'wga' );
		unregister_setting( 'jetpack_premium_analytics', 'jetpack_wga' );
		unregister_setting( 'jetpack_premium_analytics', 'wga' );
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'rest_pre_get_setting' );
		remove_all_filters( 'rest_pre_update_setting' );
		remove_all_filters( 'rest_request_after_callbacks' );
		remove_all_filters( self::FLAG_FILTER );
		remove_all_filters( 'is_jetpack_site' );
		$GLOBALS['jpa_test_wpcom_features'] = array();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Register the settings route again, so it reflects the current gates.
	 *
	 * @return void
	 */
	private function boot_route() {
		remove_all_actions( 'rest_api_init' );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		Stats_Settings::configure();
		add_action(
			'rest_api_init',
			function () {
				( new \WP_REST_Settings_Controller() )->register_routes();
			},
			99
		);
		do_action( 'rest_api_init' );
	}

	/**
	 * Read site settings through the route.
	 *
	 * @return array
	 */
	private function get_settings() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) )->get_data();
	}

	/**
	 * Write site settings through the route.
	 *
	 * @param array $values Settings to send.
	 * @return \WP_REST_Response
	 */
	private function post_settings( array $values ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $values, JSON_UNESCAPED_SLASHES ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Each gate the setting needs, turned off in turn.
	 *
	 * @return array[]
	 */
	public static function provide_closed_gates() {
		return array(
			'flag off'                 => array( 'flag' ),
			'plan without the feature' => array( 'feature' ),
		);
	}

	/**
	 * @dataProvider provide_closed_gates
	 *
	 * @param string $gate The gate to close.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_closed_gates' )]
	public function test_route_leaves_out_the_setting_when_a_gate_is_closed( $gate ) {
		if ( 'flag' === $gate ) {
			remove_all_filters( self::FLAG_FILTER );
		} else {
			$GLOBALS['jpa_test_wpcom_features'] = array();
		}
		unregister_setting( 'jetpack_premium_analytics', 'jetpack_wga' );
		$this->boot_route();

		$this->assertArrayNotHasKey( Google_Analytics_Settings::REST_NAME, $this->get_settings() );
	}

	public function test_route_reads_defaults_when_nothing_is_stored() {
		$this->assertSame(
			array(
				'is_active'    => false,
				'code'         => '',
				'anonymize_ip' => false,
			),
			$this->get_settings()[ Google_Analytics_Settings::REST_NAME ]
		);
	}

	public function test_write_keeps_the_fields_it_does_not_send() {
		update_option(
			'jetpack_wga',
			array(
				'code'               => 'G-OLD',
				'is_active'          => false,
				'honor_dnt'          => true,
				'ec_track_purchases' => true,
			)
		);

		$this->post_settings( array( Google_Analytics_Settings::REST_NAME => array( 'is_active' => true ) ) );

		$this->assertSame(
			array(
				'code'               => 'G-OLD',
				'is_active'          => true,
				'honor_dnt'          => true,
				'ec_track_purchases' => true,
			),
			get_option( 'jetpack_wga' )
		);
	}

	public function test_write_refuses_a_code_that_is_not_a_measurement_id() {
		update_option( 'jetpack_wga', array( 'code' => 'G-OLD' ) );

		$response = $this->post_settings( array( Google_Analytics_Settings::REST_NAME => array( 'code' => 'not-an-id' ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( array( 'code' => 'G-OLD' ), get_option( 'jetpack_wga' ) );
	}

	public function test_simple_sites_store_the_setting_in_wga() {
		remove_all_filters( 'is_jetpack_site' );
		$this->boot_route();

		$this->post_settings( array( Google_Analytics_Settings::REST_NAME => array( 'code' => 'G-SIMPLE' ) ) );

		$this->assertSame( array( 'code' => 'G-SIMPLE' ), get_option( 'wga' ) );
		$this->assertFalse( get_option( 'jetpack_wga' ) );
	}
}
