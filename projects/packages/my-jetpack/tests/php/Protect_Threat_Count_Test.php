<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Protect\Dashboard_Threats;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Status\Plan;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use Automattic\Jetpack\Protect_Status\Status;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * The `threatCount` that GET /my-jetpack/v1/site/protect/data serves next to Scan's threats.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Protect::get_site_protect_data
 */
class Protect_Threat_Count_Test extends TestCase {

	/**
	 * Connect the site, sign in an administrator and register the routes.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'pre_http_request', array( $this, 'block_http_request' ) );
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Initializer::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Leave no status, plan, option or user behind.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'block_http_request' ) );
		Status::$status = null;
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		Plan::has_required_plan( true );
		parent::tearDown();
	}

	/**
	 * Short-circuit every outbound HTTP request.
	 *
	 * @return \WP_Error
	 */
	public function block_http_request() {
		return new \WP_Error( 'blocked', 'Outbound HTTP requests are blocked in tests.' );
	}

	/**
	 * The endpoint's response.
	 *
	 * @return array
	 */
	private function get_data() {
		return rest_do_request( new WP_REST_Request( 'GET', '/my-jetpack/v1/site/protect/data' ) )->get_data();
	}

	public function test_leaves_out_a_threat_the_site_fixed_since_the_last_scan() {
		update_option( Current_Plan::SITE_PRODUCTS_OPTION, array( array( 'product_slug' => 'jetpack_scan' ) ) );
		Plan::has_required_plan( true );
		$threats = array();
		foreach ( array( 1, 2 ) as $id ) {
			$threats[] = (object) array(
				'id'        => $id,
				'signature' => 'PHP.Generic',
				'filename'  => ABSPATH . "threat-$id.php",
			);
		}
		update_option(
			Scan_Status::OPTION_NAME,
			maybe_serialize(
				(object) array(
					'state'       => 'idle',
					'most_recent' => (object) array( 'timestamp' => gmdate( 'c', time() - HOUR_IN_SECONDS ) ),
					'threats'     => $threats,
				)
			)
		);
		update_option( Scan_Status::OPTION_TIMESTAMP_NAME, time() + HOUR_IN_SECONDS );
		Dashboard_Threats::resolve( array( 'id' => '1' ) );

		$data = $this->get_data();

		$this->assertCount( 2, $data['scanData']->threats );
		$this->assertSame( 1, $data['threatCount'] );
	}

	public function test_is_null_without_a_stored_status() {
		Status::$status = new Status_Model( array( 'error' => true ) );

		$this->assertNull( $this->get_data()['threatCount'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_null_with_a_protect_package_that_cannot_count() {
		require_once __DIR__ . '/stubs/older-protect/class-threat-count.php';

		$this->assertNull( $this->get_data()['threatCount'] );
	}
}
