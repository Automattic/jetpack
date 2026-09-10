<?php
/**
 * Test the Jetpack Manage features in My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
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

		$this->http_request_count = 0;
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		delete_transient( Jetpack_Manage::PARTNER_TYPE_TRANSIENT_KEY );
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

		// The first signed request in a PHP process always fails with `invalid_signature`, and
		// every one after it succeeds. Burn that first call here so these tests do not depend on
		// some earlier test file having burned it — otherwise they pass in a full suite run and
		// fail when run alone. It makes no HTTP request, so it consumes no canned response and
		// does not move `$http_request_count`.
		Client::wpcom_json_api_request_as_user( '/jetpack-partners' );
	}

	/**
	 * Hand out canned HTTP responses, in order, counting the requests.
	 *
	 * WorDBless restores `$wp_filter` wholesale after each test, so this filter needs no removing.
	 *
	 * @param array $responses Responses to hand out, in order.
	 */
	protected function mock_http( array $responses ) {
		add_filter(
			'pre_http_request',
			function () use ( &$responses ) {
				++$this->http_request_count;

				// Never fall through to the network: a falsy return would let the request out, so
				// an unexpected extra call would hang CI rather than fail the assertion below it.
				return array_shift( $responses ) ?? new \WP_Error( 'unexpected_request', 'Unexpected HTTP request.' );
			}
		);
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
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
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
	 * A definitive answer is cached, so two calls only cost one lookup.
	 *
	 * @dataProvider provide_cacheable_answers
	 *
	 * @param mixed $body     Response body the /jetpack-partners endpoint returns.
	 * @param int   $code     Response status code.
	 * @param bool  $expected Whether this answer means the account is an agency.
	 */
	#[DataProvider( 'provide_cacheable_answers' )]
	public function test_is_agency_account_caches_a_definitive_answer( $body, $code, $expected ) {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( $body, $code ) ) );

		$this->assertSame( $expected, Jetpack_Manage::is_agency_account(), 'first lookup' );
		$this->assertSame( $expected, Jetpack_Manage::is_agency_account(), 'second lookup, from cache' );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * Answers that are definitive, and so must be cached.
	 *
	 * A 403 is how the endpoint reports a user with no partner account, which is most of them.
	 *
	 * @return array
	 */
	public static function provide_cacheable_answers() {
		return array(
			'no partner'         => array( array(), 200, false ),
			'agency partner'     => array( array( array( 'partner_type' => 'agency' ) ), 200, true ),
			'non-agency partner' => array( array( array( 'partner_type' => 'reseller' ) ), 200, false ),
			'forbidden'          => array( array( 'code' => 'rest_forbidden' ), 403, false ),
		);
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
