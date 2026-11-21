<?php
/**
 * Tests for the Help Center persisted open state endpoint.
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Persisted_Open_State;

require_once __DIR__ . '/class-cta-capturing-request-client.php';

/**
 * Class Persisted_Open_State_Request_Test
 */
class Persisted_Open_State_Request_Test extends \WorDBless\BaseTestCase {
	public function test_get_state_returns_the_shared_preferences_only_when_no_app_copy_is_saved() {
		$wpcom_request_client = new Cta_Capturing_Request_Client(
			200,
			'{"calypso_preferences":{"help_center_open":true,"colorScheme":"aquatic"}}'
		);

		$controller = new WP_REST_Help_Center_Persisted_Open_State( $wpcom_request_client );
		$response   = $controller->get_state();

		$this->assertSame(
			array(
				'help_center_open'           => true,
				'help_center_minimized'      => false,
				'help_center_router_history' => null,
			),
			$response->get_data()
		);
	}

	public function test_get_state_returns_the_preferences_an_app_saved_under_its_own_keys() {
		$wpcom_request_client = new Cta_Capturing_Request_Client(
			200,
			'{"calypso_preferences":{"help_center_open":false,"help_center_open_woo":true,"help_center_minimized_woo":true,"help_center_router_history_woo":{"index":0},"help_center_other_woo":true}}'
		);

		$controller = new WP_REST_Help_Center_Persisted_Open_State( $wpcom_request_client );
		$data       = $controller->get_state()->get_data();

		$this->assertFalse( $data['help_center_open'] );
		$this->assertTrue( $data['help_center_open_woo'] );
		$this->assertTrue( $data['help_center_minimized_woo'] );
		$this->assertSame( 0, $data['help_center_router_history_woo']->index );
		$this->assertArrayNotHasKey( 'help_center_other_woo', $data );
	}

	public function test_set_state_forwards_the_preferences_an_app_saves_under_its_own_keys() {
		$wpcom_request_client = new Cta_Capturing_Request_Client(
			200,
			'{"calypso_preferences":{"help_center_open_woo":true,"help_center_minimized_woo":true}}'
		);

		$request = new \WP_REST_Request( 'PUT', '/help-center/open-state' );
		$request->set_param( 'help_center_minimized_woo', true );
		$request->set_param( 'help_center_open', false );
		$request->set_param( 'colorScheme', 'aquatic' );

		$controller = new WP_REST_Help_Center_Persisted_Open_State( $wpcom_request_client );
		$response   = $controller->set_state( $request );

		$this->assertSame(
			array(
				'calypso_preferences' => array(
					'help_center_minimized_woo' => true,
					'help_center_open'          => false,
				),
			),
			$wpcom_request_client->requests[0]['body']
		);
		$this->assertSame(
			array(
				'calypso_preferences' => array(
					'help_center_open'           => false,
					'help_center_minimized'      => false,
					'help_center_router_history' => null,
					'help_center_open_woo'       => true,
					'help_center_minimized_woo'  => true,
				),
			),
			$response->get_data()
		);
	}
}
