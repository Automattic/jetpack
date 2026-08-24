<?php
/**
 * Test the Jetpack Manage features in My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use WorDBless\BaseTestCase;

class Jetpack_Manage_Test extends BaseTestCase {
	/**
	 * Admin user id
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Canned /jetpack-partners responses, consumed one per HTTP request.
	 *
	 * @var array
	 */
	protected $http_responses = array();

	/**
	 * How many outgoing HTTP requests were made.
	 *
	 * @var int
	 */
	protected $http_request_count = 0;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		$this->http_responses     = array();
		$this->http_request_count = 0;
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		remove_filter( 'pre_http_request', array( $this, 'mock_partners_request' ) );
		delete_transient( 'jetpack_partner_data' );
	}

	/**
	 * Connect the site and the given user, so `is_agency_account()` gets past its connection guard.
	 *
	 * @param int $user_id User to connect.
	 */
	protected function connect_user( $user_id ) {
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( $user_id, 'test.test.' . $user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		wp_set_current_user( $user_id );
	}

	/**
	 * Short-circuit outgoing HTTP with the next canned response, counting the calls.
	 *
	 * @return array
	 */
	public function mock_partners_request() {
		++$this->http_request_count;

		return array_shift( $this->http_responses );
	}

	/**
	 * Queue canned HTTP responses and start intercepting requests.
	 *
	 * @param array $responses Responses to hand out, in order.
	 */
	protected function mock_http( array $responses ) {
		$this->http_responses = $responses;
		add_filter( 'pre_http_request', array( $this, 'mock_partners_request' ) );
	}

	/**
	 * Build a canned HTTP response for the /jetpack-partners endpoint.
	 *
	 * @param mixed $body Value to JSON-encode as the body.
	 * @param int   $code HTTP status code.
	 * @return array
	 */
	protected function partners_response( $body, $code = 200 ) {
		return array(
			'response' => array( 'code' => $code ),
			'body'     => wp_json_encode( $body ),
		);
	}

	/**
	 * Test that the menu is not added when on multisite.
	 */
	public function test_add_submenu_jetpack_multisite() {
		if ( is_multisite() ) {
			$this->assertFalse( Jetpack_Manage::add_submenu_jetpack() );
		}

		$this->assertNotFalse( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the menu doesn't appear for non-admins.
	 */
	public function test_add_submenu_jetpack_editor() {
		wp_set_current_user( $this->editor_id );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the menu appears for admins.
	 */
	public function test_add_submenu_jetpack_admin() {
		wp_set_current_user( $this->admin_id );

		$this->assertNotFalse( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the banner is not dismissed by default.
	 */
	public function test_is_banner_dismissed_defaults_to_false() {
		$this->assertFalse( Jetpack_Manage::is_banner_dismissed() );
	}

	/**
	 * Test that dismissing the banner persists the dismissal.
	 */
	public function test_dismiss_banner_persists_dismissal() {
		wp_set_current_user( $this->admin_id );

		$response = Jetpack_Manage::dismiss_banner();

		$this->assertSame( array( 'success' => true ), $response->get_data() );
		$this->assertTrue( Jetpack_Manage::is_banner_dismissed() );
	}

	/**
	 * Test that the dismissed state is exposed to the front end.
	 */
	public function test_get_jetpack_manage_data_exposes_dismissed_state() {
		$data = Jetpack_Manage::get_jetpack_manage_data()->get_data();

		$this->assertArrayHasKey( 'isDismissed', $data );
		$this->assertFalse( $data['isDismissed'] );

		Jetpack_Manage::dismiss_banner();

		$this->assertTrue( Jetpack_Manage::get_jetpack_manage_data()->get_data()['isDismissed'] );
	}

	/**
	 * A site that is not a partner should only be looked up once — the negative answer is cached.
	 */
	public function test_is_agency_account_caches_a_negative_answer() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( array() ) ) );

		$first  = Jetpack_Manage::is_agency_account();
		$second = Jetpack_Manage::is_agency_account();

		$this->assertFalse( $first );
		$this->assertFalse( $second );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * An agency site should still be detected, and looked up only once.
	 */
	public function test_is_agency_account_caches_a_positive_answer() {
		$this->connect_user( $this->admin_id );
		$this->mock_http(
			array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) )
		);

		$first  = Jetpack_Manage::is_agency_account();
		$second = Jetpack_Manage::is_agency_account();

		$this->assertTrue( $first );
		$this->assertTrue( $second );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * A partner that is not an agency is still a definitive answer worth caching.
	 */
	public function test_is_agency_account_caches_a_non_agency_partner() {
		$this->connect_user( $this->admin_id );
		$this->mock_http(
			array( $this->partners_response( array( array( 'partner_type' => 'reseller' ) ) ) )
		);

		$first  = Jetpack_Manage::is_agency_account();
		$second = Jetpack_Manage::is_agency_account();

		$this->assertFalse( $first );
		$this->assertFalse( $second );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * The endpoint answers 403 for a user with no partner account; that is an answer, so cache it.
	 */
	public function test_is_agency_account_caches_a_forbidden_response() {
		$this->connect_user( $this->admin_id );
		$this->mock_http(
			array( $this->partners_response( array( 'code' => 'rest_forbidden' ), 403 ) )
		);

		$first  = Jetpack_Manage::is_agency_account();
		$second = Jetpack_Manage::is_agency_account();

		$this->assertFalse( $first );
		$this->assertFalse( $second );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * A failed lookup is not an answer, so it must be retried rather than cached.
	 */
	public function test_is_agency_account_does_not_cache_a_failed_lookup() {
		$this->connect_user( $this->admin_id );
		$this->mock_http(
			array(
				$this->partners_response( array(), 500 ),
				$this->partners_response( array( array( 'partner_type' => 'agency' ) ) ),
			)
		);

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
		$this->assertTrue( Jetpack_Manage::is_agency_account() );

		$this->assertSame( 2, $this->http_request_count );
	}

	/**
	 * Test that only users who can manage options may dismiss the banner.
	 */
	public function test_permissions_callback_requires_manage_options() {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Jetpack_Manage::permissions_callback() );

		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Jetpack_Manage::permissions_callback() );
	}
}
