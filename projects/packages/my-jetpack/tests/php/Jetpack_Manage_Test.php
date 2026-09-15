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
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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

		// WorDBless clears options and user meta, but not the cron array these tests schedule into.
		_set_cron_array( array() );
	}

	/**
	 * Store a partner type for a user, as a completed lookup would have.
	 *
	 * @param int    $user_id User to store against.
	 * @param string $type    Partner type, e.g. `agency` or `none`.
	 * @param int    $age     How many seconds ago the lookup ran.
	 */
	protected function store_partner_type( $user_id, $type, $age = 0 ) {
		update_user_meta(
			$user_id,
			Jetpack_Manage::PARTNER_TYPE_USER_META_KEY,
			array(
				'type' => $type,
				'time' => time() - $age,
			)
		);
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
	 * Prime the cache get_connected_user_data() reads, so the site count costs no HTTP request.
	 *
	 * @param int $user_id    Connected user.
	 * @param int $site_count Sites on their WordPress.com account.
	 */
	protected function prime_site_count( $user_id, $site_count ) {
		set_transient( 'jetpack_connected_user_data_' . $user_id, array( 'site_count' => $site_count ), HOUR_IN_SECONDS );
	}

	/**
	 * Satisfy could_use_jp_manage()'s preconditions, leaving the agency gate the only one left.
	 *
	 * @param int $user_id Connected user.
	 */
	protected function meet_manage_preconditions( $user_id ) {
		// Another test file may have loaded the mock into this process already.
		if ( ! class_exists( 'Jetpack' ) ) {
			if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
				mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
			}
			copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
			require_once WP_PLUGIN_DIR . '/jetpack/jetpack.php';
		}

		$this->prime_site_count( $user_id, 2 );
	}

	/**
	 * An account with no agency partnership gets no menu item, however many sites it has.
	 *
	 * Separate process because the mock plugin defines `Jetpack` for the rest of this PHP
	 * process, which would change what every test file after this one sees.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_submenu_jetpack_requires_an_agency_account() {
		$this->connect_user( $this->admin_id );
		$this->meet_manage_preconditions( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'none' );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * An agency account keeps the menu item.
	 *
	 * @see test_add_submenu_jetpack_requires_an_agency_account for why this runs isolated.
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_submenu_jetpack_registers_for_an_agency_account() {
		$this->connect_user( $this->admin_id );
		$this->meet_manage_preconditions( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency' );

		$this->assertIsString( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * A stored answer is trusted however old it is, so the sidebar does not flap while stale.
	 *
	 * @see test_add_submenu_jetpack_requires_an_agency_account for why this runs isolated.
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_submenu_jetpack_trusts_a_stale_stored_answer() {
		$this->connect_user( $this->admin_id );
		$this->meet_manage_preconditions( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency', YEAR_IN_SECONDS );

		$this->assertIsString( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Registering the menu never waits on WordPress.com, whatever is or isn't stored.
	 */
	public function test_add_submenu_jetpack_makes_no_http_request() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'agency' );
		$this->mock_http( array() );

		Jetpack_Manage::add_submenu_jetpack();

		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Test that the menu doesn't appear for non-admins.
	 */
	public function test_add_submenu_jetpack_editor() {
		wp_set_current_user( $this->editor_id );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
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
	 * The refresh stores whatever definitive answer the endpoint gave.
	 *
	 * @dataProvider provide_definitive_answers
	 *
	 * @param mixed  $body     Response body the /jetpack-partners endpoint returns.
	 * @param int    $code     Response status code.
	 * @param string $expected Partner type this answer should store.
	 */
	#[DataProvider( 'provide_definitive_answers' )]
	public function test_refresh_partner_type_stores_a_definitive_answer( $body, $code, $expected ) {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( $body, $code ) ) );

		Jetpack_Manage::refresh_partner_type( $this->admin_id );

		$stored = get_user_meta( $this->admin_id, Jetpack_Manage::PARTNER_TYPE_USER_META_KEY, true );

		$this->assertSame( $expected, $stored['type'] );
		$this->assertSame( 'agency' === $expected, Jetpack_Manage::is_agency_account() );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * Answers that settle the question, and so must be stored.
	 *
	 * A 403 is how the endpoint reports a user with no partner account, which is most of them.
	 *
	 * @return array
	 */
	public static function provide_definitive_answers() {
		return array(
			'no partner'         => array( array(), 200, 'none' ),
			'agency partner'     => array( array( array( 'partner_type' => 'agency' ) ), 200, 'agency' ),
			'non-agency partner' => array( array( array( 'partner_type' => 'reseller' ) ), 200, 'reseller' ),
			'forbidden'          => array( array( 'code' => 'rest_forbidden' ), 403, 'none' ),
		);
	}

	/**
	 * The cron request has no current user, so the lookup has to sign as the one it was given.
	 *
	 * Signing as the current user instead would leave nothing stored, because user 0 holds no
	 * token for the request to be signed with.
	 */
	public function test_refresh_partner_type_signs_as_the_given_user() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );

		wp_set_current_user( 0 );
		Jetpack_Manage::refresh_partner_type( $this->admin_id );

		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Jetpack_Manage::is_agency_account() );
	}

	/**
	 * A failed lookup is not an answer, so it must leave the last good one in place.
	 */
	public function test_refresh_partner_type_keeps_the_stored_answer_when_the_lookup_fails() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency' );
		$this->mock_http( array( $this->partners_response( array(), 500 ) ) );

		Jetpack_Manage::refresh_partner_type( $this->admin_id );

		$this->assertTrue( Jetpack_Manage::is_agency_account() );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * The answer is about a WordPress.com account, so one admin's must not answer for another's.
	 */
	public function test_is_agency_account_reads_only_the_current_users_answer() {
		$this->connect_user( $this->admin_id );
		$this->connect_user( $this->editor_id );
		$this->store_partner_type( $this->admin_id, 'agency' );
		$this->store_partner_type( $this->editor_id, 'none' );
		$this->mock_http( array() );

		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Jetpack_Manage::is_agency_account() );

		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Jetpack_Manage::is_agency_account() );

		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * A user nobody has looked up yet reads as not an agency, without asking WordPress.com.
	 */
	public function test_is_agency_account_never_makes_a_request() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array() );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Disconnecting a user drops the answer that was about their WordPress.com account.
	 */
	public function test_unlinking_a_user_forgets_their_partner_type() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency' );

		Jetpack_Manage::forget_partner_type( $this->admin_id );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
	}

	/**
	 * A connected user with no answer yet gets a refresh queued, rather than one inline.
	 */
	public function test_maybe_schedule_partner_type_refresh_queues_a_job() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array() );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertIsInt( wp_next_scheduled( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) ) );
		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Logging in is what normally queues the refresh.
	 */
	public function test_logging_in_queues_a_refresh() {
		$this->connect_user( $this->admin_id );

		Jetpack_Manage::schedule_partner_type_refresh_on_login( 'dummy_user', get_userdata( $this->admin_id ) );

		$this->assertIsInt( wp_next_scheduled( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) ) );
	}

	/**
	 * Nothing is queued when it would have nothing to do.
	 *
	 * @dataProvider provide_pointless_refreshes
	 *
	 * @param bool        $connect      Whether to connect the user first.
	 * @param string|null $stored_type  Partner type to store, or null to store none.
	 * @param int         $stored_age   How many seconds ago that answer was stored.
	 */
	#[DataProvider( 'provide_pointless_refreshes' )]
	public function test_maybe_schedule_partner_type_refresh_skips_pointless_work( $connect, $stored_type, $stored_age ) {
		if ( $connect ) {
			$this->connect_user( $this->admin_id );
		}
		if ( null !== $stored_type ) {
			$this->store_partner_type( $this->admin_id, $stored_type, $stored_age );
		}

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertFalse( wp_next_scheduled( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) ) );
	}

	/**
	 * Cases where scheduling a refresh would be wasted work.
	 *
	 * @return array
	 */
	public static function provide_pointless_refreshes() {
		return array(
			'not connected'       => array( false, null, 0 ),
			'answer still fresh'  => array( true, 'agency', MINUTE_IN_SECONDS ),
			'answer just in time' => array( true, 'none', HOUR_IN_SECONDS ),
		);
	}

	/**
	 * An answer older than a day is worth asking about again.
	 */
	public function test_maybe_schedule_partner_type_refresh_queues_a_job_for_a_stale_answer() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency', DAY_IN_SECONDS + 1 );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertIsInt( wp_next_scheduled( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) ) );
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
