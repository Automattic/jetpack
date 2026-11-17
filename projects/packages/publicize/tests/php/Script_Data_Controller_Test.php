<?php
/**
 * Tests for Script_Data_Controller.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Class Script_Data_Controller_Test
 */
class Script_Data_Controller_Test extends TestCase {

	/**
	 * Register the route the way a request does, so it must not depend on Publicize being on.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		Publicize_Setup::pre_initialization();
	}

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		global $wp_rest_server;

		$wp_rest_server = null;
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_publicize' ) );
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Report Publicize as the active module.
	 *
	 * @return array
	 */
	public function activate_publicize() {
		return array( 'publicize' );
	}

	/**
	 * Who may read the Social dashboard's data, with Publicize on and off.
	 *
	 * @return array
	 */
	public static function provide_access_cases() {
		return array(
			'admin, Publicize off'      => array( 'administrator', false, 200 ),
			'author, Publicize off'     => array( 'author', false, 403 ),
			'author, Publicize on'      => array( 'author', true, 200 ),
			'contributor, Publicize on' => array( 'contributor', true, 403 ),
			'logged out, Publicize on'  => array( null, true, 401 ),
		);
	}

	/**
	 * The endpoint applies the Social admin page's gate.
	 *
	 * @dataProvider provide_access_cases
	 *
	 * @param string|null $role            The current user's role, or null for logged out.
	 * @param bool        $publicize_on    Whether the Publicize module is active.
	 * @param int         $expected_status The expected HTTP status.
	 */
	#[DataProvider( 'provide_access_cases' )]
	public function test_access( $role, $publicize_on, $expected_status ) {
		if ( $publicize_on ) {
			add_filter( 'jetpack_active_modules', array( $this, 'activate_publicize' ) );
		}
		if ( $role ) {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'dummy_' . $role,
						'user_pass'  => 'dummy_pass',
						'role'       => $role,
					)
				)
			);
		}

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wpcom/v2/publicize/script-data' ) );

		$this->assertSame( $expected_status, $response->get_status() );
		if ( 200 === $expected_status ) {
			// The key whose absence crashed the dashboard when it opened from another page.
			$this->assertArrayHasKey( 'socialToggleBase', $response->get_data()['api_paths'] );
		}
	}
}
