<?php
/**
 * Test the Jetpack Manage features in My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Utils;
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
	 * URLs of the outgoing HTTP requests, in order.
	 *
	 * @var string[]
	 */
	protected $http_request_urls = array();

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
		$this->http_request_urls  = array();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
	}

	/**
	 * Store a partner type for a user, as a completed lookup would have.
	 *
	 * @param int    $user_id       User to store against.
	 * @param string $type          Partner type, e.g. `agency` or `none`.
	 * @param int    $age           How many seconds ago the lookup ran.
	 * @param int    $wpcom_user_id WordPress.com account the answer describes.
	 */
	protected function store_partner_type( $user_id, $type, $age = 0, $wpcom_user_id = 0 ) {
		update_user_meta(
			$user_id,
			Jetpack_Manage::PARTNER_TYPE_USER_META_KEY,
			array(
				'type'          => $type,
				'time'          => time() - $age,
				'wpcom_user_id' => $wpcom_user_id,
			)
		);
	}

	/**
	 * The WordPress.com account connect_user() binds a local user to.
	 *
	 * @param int $user_id Local user.
	 * @return int
	 */
	protected function wpcom_id( $user_id ) {
		return 1000 + $user_id;
	}

	/**
	 * Connect the site and the given user, as a site running the Jetpack plugin would have them.
	 *
	 * @param int  $user_id      User to connect.
	 * @param bool $bind         Whether the user is bound to a WordPress.com account yet.
	 * @param bool $with_jetpack Whether to load the mock Jetpack plugin, which every Manage surface requires.
	 */
	protected function connect_user( $user_id, $bind = true, $with_jetpack = true ) {
		if ( $with_jetpack && ! class_exists( 'Jetpack' ) ) {
			if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
				mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
			}
			copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
			require_once WP_PLUGIN_DIR . '/jetpack/jetpack.php';
		}

		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( $user_id, 'test.test.' . $user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		wp_set_current_user( $user_id );

		if ( $bind ) {
			Utils::set_wpcom_user_id( $user_id, $this->wpcom_id( $user_id ) );
		}

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
			function ( $preempt, $args, $url ) use ( &$responses ) {
				++$this->http_request_count;
				$this->http_request_urls[] = $url;

				// Never fall through to the network: a falsy return would let the request out, so
				// an unexpected extra call would hang CI rather than fail the assertion below it.
				return array_shift( $responses ) ?? new \WP_Error( 'unexpected_request', 'Unexpected HTTP request.' );
			},
			10,
			3
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
	 * Whether a refresh is queued for a user.
	 *
	 * @param int $user_id User to check.
	 * @return int|false
	 */
	protected function queued_refresh( $user_id ) {
		return wp_next_scheduled( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $user_id ) );
	}

	/**
	 * An account with no agency partnership gets no menu item, however many sites it has.
	 */
	public function test_add_submenu_jetpack_requires_an_agency_account() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'none' );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
	}

	public function test_add_submenu_jetpack_registers_for_an_agency_account() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'agency' );

		$this->assertIsString( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * An older admin-ui without the named position tiers still gets the external slot.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_submenu_jetpack_registers_without_position_constants() {
		require_once __DIR__ . '/stubs/older-admin-ui/class-admin-menu.php';
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'agency' );

		$this->assertIsString( Jetpack_Manage::add_submenu_jetpack() );
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared by the stub, which Phan excludes.
		$this->assertSame( array( 100 ), array_values( Admin_Menu::$positions ) );
	}

	/**
	 * A stored answer is trusted however old it is, so the sidebar does not flap while stale.
	 */
	public function test_add_submenu_jetpack_trusts_a_stale_stored_answer() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'agency', YEAR_IN_SECONDS );

		$this->assertIsString( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Fails if the gates swap order: the site count is left unprimed, so reaching it costs a request.
	 */
	public function test_add_submenu_jetpack_rejects_a_non_agency_without_any_http_request() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'none' );
		$this->mock_http( array() );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
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
	 * The refresh stores the endpoint's answer, tied to the WordPress.com account it describes.
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
		$this->assertSame( $this->wpcom_id( $this->admin_id ), $stored['wpcom_user_id'] );
		$this->assertSame( 'agency' === $expected, Jetpack_Manage::is_agency_account() );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * Answers that settle the question, and so must be stored.
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
	 * An unbound user has their WordPress.com account resolved first, so the answer can be checked later.
	 */
	public function test_refresh_partner_type_records_the_account_of_an_unbound_user() {
		$this->connect_user( $this->admin_id, false );
		set_transient( 'jetpack_connected_user_data_' . $this->admin_id, array( 'ID' => 777 ), HOUR_IN_SECONDS );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );

		Jetpack_Manage::refresh_partner_type( $this->admin_id );

		$stored = get_user_meta( $this->admin_id, Jetpack_Manage::PARTNER_TYPE_USER_META_KEY, true );

		$this->assertSame( 777, $stored['wpcom_user_id'] );
		$this->assertSame( 777, Utils::get_wpcom_user_id( $this->admin_id ) );
	}

	/**
	 * With no account to tie it to, the answer is never asked for, and the lookup backs off.
	 */
	public function test_a_lookup_that_cannot_identify_the_account_stores_nothing() {
		$this->connect_user( $this->admin_id, false );
		$this->mock_http( array( new \WP_Error( 'http_request_failed', 'Unreachable.' ) ) );

		Jetpack_Manage::refresh_partner_type( $this->admin_id );
		$this->assertSame( '', get_user_meta( $this->admin_id, Jetpack_Manage::PARTNER_TYPE_USER_META_KEY, true ) );
		$this->assertCount( 1, $this->http_request_urls );
		$this->assertStringContainsString( 'jetpack-wpcom-user-data', $this->http_request_urls[0] );

		Jetpack_Manage::refresh_partner_type_if_stale( $this->admin_id );
		$this->assertCount( 1, $this->http_request_urls, 'backed off' );
	}

	/**
	 * A cron request has no current user, so the lookup must sign as the one it was given.
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

	public function test_is_agency_account_never_makes_a_request() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array() );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
		$this->assertSame( 0, $this->http_request_count );
	}

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

		$this->assertIsInt( $this->queued_refresh( $this->admin_id ) );
		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Logging in is what normally queues the refresh.
	 */
	public function test_logging_in_queues_a_refresh() {
		$this->connect_user( $this->admin_id );

		Jetpack_Manage::schedule_partner_type_refresh_on_login( 'dummy_user', get_userdata( $this->admin_id ) );

		$this->assertIsInt( $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * Some callers fire `wp_login` with the username alone.
	 */
	public function test_a_login_without_a_user_object_queues_nothing() {
		$this->connect_user( $this->admin_id );

		Jetpack_Manage::schedule_partner_type_refresh_on_login( 'dummy_user' );

		$this->assertFalse( $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * Every queued refresh is a write to the autoloaded cron option.
	 *
	 * @dataProvider provide_pointless_refreshes
	 *
	 * @param bool        $connect     Whether to connect the user first.
	 * @param string|null $stored_type Partner type to store, or null to store none.
	 * @param int         $stored_age  How many seconds ago that answer was stored.
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

		$this->assertFalse( $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * Cases where scheduling a refresh would be wasted work.
	 *
	 * @return array
	 */
	public static function provide_pointless_refreshes() {
		return array(
			'not connected'              => array( false, null, 0 ),
			'answer still fresh'         => array( true, 'agency', MINUTE_IN_SECONDS ),
			'answer just short of stale' => array( true, 'none', DAY_IN_SECONDS - MINUTE_IN_SECONDS ),
		);
	}

	/**
	 * An answer exactly a day old is stale.
	 */
	public function test_maybe_schedule_partner_type_refresh_queues_a_job_for_a_stale_answer() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency', DAY_IN_SECONDS );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertIsInt( $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * Nothing lets an Editor see the answer, so they are never looked up.
	 */
	public function test_a_user_who_cannot_manage_options_is_never_looked_up() {
		$this->connect_user( $this->editor_id );
		$this->mock_http( array() );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->editor_id );
		Jetpack_Manage::refresh_partner_type_if_stale( $this->editor_id );

		$this->assertFalse( $this->queued_refresh( $this->editor_id ) );
		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Nothing shows the answer without the Jetpack plugin, so nobody is looked up.
	 *
	 * Isolated because another test file may already have defined `Jetpack` in this process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_site_without_the_jetpack_plugin_is_never_looked_up() {
		$this->connect_user( $this->admin_id, true, false );
		$this->mock_http( array() );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );
		Jetpack_Manage::refresh_partner_type_if_stale( $this->admin_id );

		$this->assertFalse( class_exists( 'Jetpack' ) );
		$this->assertFalse( $this->queued_refresh( $this->admin_id ) );
		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * Storing a non-answer would read as "not an agency" for a day.
	 *
	 * @dataProvider provide_non_answers
	 *
	 * @param mixed $body Response body the /jetpack-partners endpoint returns.
	 * @param int   $code Response status code.
	 */
	#[DataProvider( 'provide_non_answers' )]
	public function test_refresh_partner_type_stores_nothing_for_a_non_answer( $body, $code ) {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( $body, $code ) ) );

		Jetpack_Manage::refresh_partner_type( $this->admin_id );

		$this->assertSame( '', get_user_meta( $this->admin_id, Jetpack_Manage::PARTNER_TYPE_USER_META_KEY, true ) );
	}

	/**
	 * Responses that say nothing about this user's partner account.
	 *
	 * @return array
	 */
	public static function provide_non_answers() {
		return array(
			'rejected token'    => array( array( 'code' => 'invalid_token' ), 401 ),
			'rate limited'      => array( array( 'code' => 'too_many_requests' ), 429 ),
			'not found'         => array( array( 'code' => 'not_found' ), 404 ),
			'server error'      => array( array(), 500 ),
			'unparseable 200'   => array( null, 200 ),
			'transport failure' => array( array(), 0 ),
		);
	}

	/**
	 * A WordPress.com outage must not be re-asked on every page load.
	 */
	public function test_a_failed_lookup_backs_off_before_asking_again() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( array(), 500 ) ) );

		Jetpack_Manage::refresh_partner_type_if_stale( $this->admin_id );
		$this->assertSame( 1, $this->http_request_count, 'first attempt' );

		Jetpack_Manage::refresh_partner_type_if_stale( $this->admin_id );
		$this->assertSame( 1, $this->http_request_count, 'second attempt, backed off' );
	}

	public function test_a_failed_lookup_backs_off_before_rescheduling() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( array(), 500 ) ) );

		Jetpack_Manage::refresh_partner_type_if_stale( $this->admin_id );
		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertFalse( $this->queued_refresh( $this->admin_id ) );
	}

	public function test_an_answer_bound_to_another_wpcom_account_is_discarded() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency', 0, 111 );
		Utils::set_wpcom_user_id( $this->admin_id, 222 );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
	}

	public function test_an_answer_bound_to_the_same_wpcom_account_is_kept() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency', 0, $this->wpcom_id( $this->admin_id ) );

		$this->assertTrue( Jetpack_Manage::is_agency_account() );
	}

	/**
	 * A reconnect rewrites the token, which is what clears the binding the check reads.
	 */
	public function test_a_reconnect_discards_the_previous_accounts_answer() {
		$this->connect_user( $this->admin_id );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );
		Jetpack_Manage::refresh_partner_type( $this->admin_id );
		$this->assertTrue( Jetpack_Manage::is_agency_account(), 'before the reconnect' );

		// Registered by Connection_Manager::configure(), which these tests do not run.
		add_action( 'pre_update_jetpack_option_user_tokens', array( new Connection_Manager(), 'unbind_wpcom_user_ids_for_new_tokens' ), 10, 2 );
		( new Tokens() )->update_user_token( $this->admin_id, 'second.secret.' . $this->admin_id, false );

		$this->assertFalse( Jetpack_Manage::is_agency_account(), 'after the reconnect' );
	}

	/**
	 * A value this class did not write must not grant the link, or fatal.
	 *
	 * @dataProvider provide_unusable_stored_values
	 *
	 * @param mixed $stored Value written to the meta key.
	 */
	#[DataProvider( 'provide_unusable_stored_values' )]
	public function test_an_unusable_stored_value_reads_as_not_an_agency( $stored ) {
		$this->connect_user( $this->admin_id );
		update_user_meta( $this->admin_id, Jetpack_Manage::PARTNER_TYPE_USER_META_KEY, $stored );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
	}

	/**
	 * Shapes that are not a stored answer.
	 *
	 * @return array
	 */
	public static function provide_unusable_stored_values() {
		return array(
			'legacy bare string' => array( 'agency' ),
			'missing time'       => array( array( 'type' => 'agency' ) ),
			'missing type'       => array( array( 'time' => 100 ) ),
		);
	}

	/**
	 * Cron normally runs at `shutdown`, after `admin_init`, so a just-due refresh is about to run.
	 */
	public function test_an_event_only_just_due_is_left_to_run() {
		$this->connect_user( $this->admin_id );
		$due = time() - 5;
		wp_schedule_single_event( $due, Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertSame( $due, $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * An event exactly an hour overdue is past the grace period.
	 */
	public function test_an_event_an_hour_overdue_is_replaced() {
		$this->connect_user( $this->admin_id );
		wp_schedule_single_event( time() - HOUR_IN_SECONDS, Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertGreaterThan( time(), $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * A long-overdue event means cron is not running it, so it is replaced rather than trusted.
	 */
	public function test_a_long_overdue_event_is_replaced() {
		$this->connect_user( $this->admin_id );
		wp_schedule_single_event( time() - 2 * HOUR_IN_SECONDS, Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertGreaterThan( time(), $this->queued_refresh( $this->admin_id ) );
	}

	public function test_a_pending_event_is_not_rescheduled() {
		$this->connect_user( $this->admin_id );
		$when = time() + HOUR_IN_SECONDS;
		wp_schedule_single_event( $when, Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, array( $this->admin_id ) );

		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		$this->assertSame( $when, $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * The REST payload looks a user up when nobody has, so a cron-less site still gets an answer.
	 */
	public function test_get_jetpack_manage_data_looks_up_a_user_nobody_has() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );

		$data = Jetpack_Manage::get_jetpack_manage_data()->get_data();

		$this->assertTrue( $data['isAgencyAccount'] );
		$this->assertSame( 1, $this->http_request_count );
	}

	/**
	 * A stale stored answer is refreshed too, so "none" is not a life sentence.
	 */
	public function test_get_jetpack_manage_data_refreshes_a_stale_answer() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'none', DAY_IN_SECONDS + 1 );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );

		$this->assertTrue( Jetpack_Manage::get_jetpack_manage_data()->get_data()['isAgencyAccount'] );
	}

	public function test_get_jetpack_manage_data_leaves_a_fresh_answer_alone() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 2 );
		$this->store_partner_type( $this->admin_id, 'none' );
		$this->mock_http( array() );

		Jetpack_Manage::get_jetpack_manage_data();

		$this->assertSame( 0, $this->http_request_count );
	}

	/**
	 * A user who could never see the banner is not made to wait for the lookup.
	 */
	public function test_get_jetpack_manage_data_skips_the_lookup_when_manage_is_unavailable() {
		$this->connect_user( $this->admin_id );
		$this->prime_site_count( $this->admin_id, 1 );
		$this->mock_http( array() );

		$data = Jetpack_Manage::get_jetpack_manage_data()->get_data();

		$this->assertFalse( $data['isEnabled'] );
		$this->assertFalse( $data['isAgencyAccount'] );
		$this->assertSame( 0, $this->http_request_count );
	}

	public function test_the_unlink_hook_forgets_the_partner_type() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'agency' );
		Jetpack_Manage::init();

		do_action( 'jetpack_unlinked_user', $this->admin_id );

		$this->assertFalse( Jetpack_Manage::is_agency_account() );
	}

	public function test_forgetting_a_partner_type_clears_the_queued_refresh() {
		$this->connect_user( $this->admin_id );
		Jetpack_Manage::maybe_schedule_partner_type_refresh( $this->admin_id );

		Jetpack_Manage::forget_partner_type( $this->admin_id );

		$this->assertFalse( $this->queued_refresh( $this->admin_id ) );
	}

	public function test_the_login_hook_queues_a_refresh() {
		$this->connect_user( $this->admin_id );
		Jetpack_Manage::init();

		do_action( 'wp_login', 'dummy_user', get_userdata( $this->admin_id ) );

		$this->assertIsInt( $this->queued_refresh( $this->admin_id ) );
	}

	/**
	 * `admin_init` hands its callbacks `''`, which must mean the current user, not user 0.
	 *
	 * Firing the action itself would run all of core's admin_init work, so the callback is called
	 * with the argument the action passes.
	 */
	public function test_the_admin_init_hook_queues_a_refresh_for_the_current_user() {
		$this->connect_user( $this->admin_id );
		Jetpack_Manage::init();

		$this->assertNotFalse(
			has_action( 'admin_init', array( Jetpack_Manage::class, 'maybe_schedule_partner_type_refresh' ) )
		);

		Jetpack_Manage::maybe_schedule_partner_type_refresh( '' );

		$this->assertIsInt( $this->queued_refresh( $this->admin_id ) );
		$this->assertFalse( $this->queued_refresh( 0 ) );
	}

	/**
	 * The cron run skips a user whose answer was refreshed inline since it was queued.
	 */
	public function test_the_cron_hook_skips_an_answer_already_fresh() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'none' );
		$this->mock_http( array() );
		Jetpack_Manage::init();

		do_action( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, $this->admin_id );

		$this->assertSame( 0, $this->http_request_count );
	}

	public function test_the_cron_hook_refreshes_a_stale_answer() {
		$this->connect_user( $this->admin_id );
		$this->store_partner_type( $this->admin_id, 'none', DAY_IN_SECONDS + 1 );
		$this->mock_http( array( $this->partners_response( array( array( 'partner_type' => 'agency' ) ) ) ) );
		Jetpack_Manage::init();

		do_action( Jetpack_Manage::PARTNER_TYPE_REFRESH_HOOK, $this->admin_id );

		$this->assertTrue( Jetpack_Manage::is_agency_account() );
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
