<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Status\Status as Protect_Status;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for Red_Bubble_Notifications.
 *
 * @package automattic/my-jetpack
 * @covers \Automattic\Jetpack\My_Jetpack\Red_Bubble_Notifications
 */
#[CoversClass( Red_Bubble_Notifications::class )]
class Red_Bubble_Notifications_Test extends TestCase {

	/**
	 * Connection manager whose meta-cap map resolves `jetpack_connect`, which this bootstrap doesn't wire.
	 *
	 * @var Connection_Manager
	 */
	private $manager;

	/**
	 * Set up a site connection with no user connections and a historically active product that needs one.
	 */
	public function setUp(): void {
		parent::setUp();

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'historically_active_modules', array( 'search' ) );
		( new Connection_Manager() )->reset_connection_status();

		$this->manager = new Connection_Manager();
		add_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1 );
		remove_all_filters( 'jetpack_disconnect_cap' );
		remove_all_filters( 'jetpack_protect_threat_notifications_enabled' );
		remove_all_filters( 'my_jetpack_red_bubble_notification_slugs' );
		remove_all_filters( 'pre_http_request' );
		remove_all_actions( 'set_transient_' . Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		remove_all_actions( 'upgrader_process_complete' );
		remove_all_actions( 'deleted_plugin' );
		remove_all_actions( 'add_option_jetpack_scan_status' );
		remove_all_actions( 'update_option_jetpack_scan_status' );
		Protect_Status::$status = null;
		// Storing a different plan clears Current_Plan's cached copy, which outlives the option.
		Current_Plan::update_from_site_record(
			array(
				'plan'     => array( 'product_slug' => 'jetpack_free' ),
				'products' => array(),
			)
		);
		wp_set_current_user( 0 );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		( new Connection_Manager() )->reset_connection_status();

		parent::tearDown();
	}

	/**
	 * Log in a new user with the given role.
	 *
	 * @param string $role The user's role.
	 * @return \WP_User
	 */
	private function log_in_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => "test_$role",
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return wp_get_current_user();
	}

	/**
	 * A user who can take the vacant owner slot is alerted about the missing user connection.
	 */
	public function test_alerts_missing_user_connection_when_user_can_take_ownership() {
		$this->log_in_as( 'administrator' );

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * A secondary user's token doesn't hide the alert while no owner is recorded.
	 */
	public function test_alerts_missing_user_connection_when_only_a_secondary_user_is_connected() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'test_connected_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
		( new Tokens() )->update_user_token( $editor_id, "token.secret.$editor_id", false );
		$this->log_in_as( 'administrator' );
		( new Connection_Manager() )->reset_connection_status();

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * A role granted connection rights through `jetpack_disconnect_cap` is alerted too.
	 */
	public function test_alerts_missing_user_connection_when_role_is_granted_connection_rights() {
		add_filter(
			'jetpack_disconnect_cap',
			static function () {
				return array( 'edit_others_posts' );
			}
		);
		$this->log_in_as( 'editor' );

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * Assert the alerts hold the missing user connection alert.
	 *
	 * @param array $alerts The alerts returned by alert_if_missing_connection().
	 */
	private function assert_user_alert( $alerts ) {
		$this->assertSame(
			array(
				'type'     => 'user',
				'is_error' => true,
			),
			$alerts['missing-connection'] ?? null
		);
	}

	/**
	 * Whether the host lets threats be announced, and whether the Protect alert is added.
	 *
	 * @return array
	 */
	public static function provide_threat_notification_cases() {
		return array(
			'notifications on'  => array( true, true ),
			'notifications off' => array( false, false ),
		);
	}

	/**
	 * A paid Protect plan with threats raises the alert only when the host allows it.
	 *
	 * @param bool $notify   Whether the host lets threats be announced.
	 * @param bool $expected Whether the alert is added.
	 *
	 * @dataProvider provide_threat_notification_cases
	 */
	#[DataProvider( 'provide_threat_notification_cases' )]
	public function test_protect_threats_alert_follows_the_host_filter( $notify, $expected ) {
		Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array( 'active' => array( 'scan' ) ),
				),
				'products' => array(),
			)
		);
		Protect_Status::$status = new Status_Model(
			array(
				'threats'            => array( new Threat_Model( array( 'severity' => 5 ) ) ),
				'fixable_threat_ids' => array(),
			)
		);
		if ( ! $notify ) {
			add_filter( 'jetpack_protect_threat_notifications_enabled', '__return_false' );
		}

		$alerts = Red_Bubble_Notifications::alert_if_protect_has_threats( array() );

		$this->assertSame( $expected, isset( $alerts['protect_has_threats'] ) );
	}

	/**
	 * A recorded owner without a token is left to the connection error notice, even for an admin.
	 */
	public function test_skips_missing_user_connection_when_owner_is_recorded() {
		$this->log_in_as( 'administrator' );
		Jetpack_Options::update_option( 'master_user', get_current_user_id() );
		( new Connection_Manager() )->reset_connection_status();

		$alerts = Red_Bubble_Notifications::alert_if_missing_connection( array() );

		$this->assertArrayNotHasKey( 'missing-connection', $alerts );
	}

	/**
	 * A user who can't take the vacant owner slot (e.g. an editor) gets no connect CTA.
	 */
	public function test_skips_missing_user_connection_when_user_cannot_take_ownership() {
		$this->log_in_as( 'editor' );

		$alerts = Red_Bubble_Notifications::alert_if_missing_connection( array() );

		$this->assertArrayNotHasKey( 'missing-connection', $alerts );
	}

	/**
	 * Data provider for test_plugins_needed_alert_counts_only_standalone_purchases.
	 *
	 * @return array
	 */
	public static function provide_plugins_needed_purchases() {
		return array(
			'standalone Boost'    => array( 'jetpack_boost_yearly', false ),
			'prefixed standalone' => array( 'a4a_jetpack_boost_yearly', false ),
			'Complete bundle'     => array( 'jetpack_complete', true ),
		);
	}

	/**
	 * A plan missing its plugin adds to the menu count only when the plan is that product alone.
	 *
	 * @param string $plan_slug The purchased plan.
	 * @param bool   $silent    Whether the alert stays out of the menu count.
	 *
	 * @dataProvider provide_plugins_needed_purchases
	 */
	#[DataProvider( 'provide_plugins_needed_purchases' )]
	public function test_plugins_needed_alert_counts_only_standalone_purchases( $plan_slug, $silent ) {
		$this->log_in_as( 'administrator' );
		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array(
				(object) array(
					'product_slug'  => $plan_slug,
					'expiry_status' => 'active',
					'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
				),
			),
			HOUR_IN_SECONDS
		);
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => array(),
				'available' => (object) array( 'cloud-critical-css' => array( 'jetpack_complete' ) ),
			),
			HOUR_IN_SECONDS
		);

		$alerts = Red_Bubble_Notifications::alert_if_paid_plan_requires_plugin_install_or_activation( array() );

		$this->assertArrayHasKey( "$plan_slug--plugins_needing_installed_activated", $alerts );
		$this->assertSame( $silent, ! empty( $alerts[ "$plan_slug--plugins_needing_installed_activated" ]['is_silent'] ) );
	}

	/**
	 * A bundle whose plugins are all active raises no plugins-needed alert.
	 */
	public function test_plugins_needed_alert_skips_bundle_with_active_plugins() {
		$this->log_in_as( 'administrator' );
		update_option( 'active_plugins', array( Products\Boost::get_installed_plugin_filename() ) );
		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array(
				(object) array(
					'product_slug'  => 'jetpack_complete',
					'expiry_status' => 'active',
					'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
				),
			),
			HOUR_IN_SECONDS
		);
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => array(),
				'available' => (object) array( 'cloud-critical-css' => array( 'jetpack_complete' ) ),
			),
			HOUR_IN_SECONDS
		);

		$alerts = Red_Bubble_Notifications::alert_if_paid_plan_requires_plugin_install_or_activation( array() );

		$this->assertArrayNotHasKey( 'jetpack_complete--plugins_needing_installed_activated', $alerts );
	}

	/**
	 * Data provider for test_a_lapsed_scan_purchase_raises_the_plan_expired_alert.
	 *
	 * @return array
	 */
	public static function provide_lapsed_scan_purchases() {
		return array(
			'lapsed Scan'     => array( 'jetpack_scan' ),
			'lapsed Security' => array( 'jetpack_security_t1_yearly' ),
		);
	}

	/**
	 * A lapsed purchase that includes Scan raises the plan-expired alert, though Protect Status no longer counts it.
	 *
	 * @param string $plan_slug The lapsed plan.
	 *
	 * @dataProvider provide_lapsed_scan_purchases
	 */
	#[DataProvider( 'provide_lapsed_scan_purchases' )]
	public function test_a_lapsed_scan_purchase_raises_the_plan_expired_alert( $plan_slug ) {
		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array(
				(object) array(
					'ID'             => 1,
					'product_slug'   => $plan_slug,
					'product_name'   => 'Lapsed plan',
					'expiry_status'  => Products::STATUS_EXPIRED,
					'expiry_date'    => gmdate( 'Y-m-d H:i:s', strtotime( '-1 week' ) ),
					'expiry_message' => 'Expired',
				),
			),
			HOUR_IN_SECONDS
		);
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => array(),
				'available' => (object) array( 'scan' => array( 'jetpack_security_t1_yearly' ) ),
			),
			HOUR_IN_SECONDS
		);
		set_transient( Wpcom_Products::MY_JETPACK_PLAN_REFRESHED_TRANSIENT_KEY, 1, HOUR_IN_SECONDS );

		$alerts = Red_Bubble_Notifications::alert_if_paid_plan_expiring( array() );

		$this->assertFalse( Products\Protect::has_paid_plan_for_product() );
		$this->assertContains( Products\Protect::get_name(), $alerts[ "$plan_slug--plan_expired" ]['products_effected'] ?? array() );
	}

	/**
	 * Fetch the alerts through the REST route, as My Jetpack does.
	 *
	 * @param string[] $dismissal_cookies Cookies the page passes, as "name=value".
	 * @return array
	 */
	private function fetch_alerts_over_rest( array $dismissal_cookies = array() ) {
		$request = new \WP_REST_Request( 'POST', '/my-jetpack/v1/red-bubble-notifications' );
		$request->set_param( 'dismissal_cookies', $dismissal_cookies );

		return Red_Bubble_Notifications::rest_api_get_red_bubble_alerts( $request )->get_data();
	}

	/**
	 * Add an alert on every computation and return a counter of the computations.
	 *
	 * @param string $slug The alert to add.
	 * @return \ArrayObject Its `count` is how often the alerts were computed.
	 */
	private function add_alert_and_count_computations( $slug ) {
		$computations = new \ArrayObject( array( 'count' => 0 ) );
		Red_Bubble_Notifications::register_cache_invalidation();
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array(), HOUR_IN_SECONDS );
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'blocked', 'No HTTP in tests.' );
			}
		);
		add_filter(
			'my_jetpack_red_bubble_notification_slugs',
			function ( $alerts ) use ( $slug, $computations ) {
				++$computations['count'];
				$alerts[ $slug ] = array( 'type' => 'test' );
				return $alerts;
			},
			20
		);

		return $computations;
	}

	/**
	 * Data provider for test_rest_route_reads_the_cache_and_applies_dismissals_after.
	 *
	 * @return array
	 */
	public static function provide_dismissible_alerts() {
		return array(
			'backup failure'        => array( 'backup_failure', 'backup_failure_dismissed' ),
			'Protect threats'       => array( 'protect_has_threats', 'protect_threats_detected_dismissed' ),
			'plan expired'          => array( 'jetpack_scan--plan_expired', 'jetpack_scan--plan_expired_dismissed' ),
			'plan expiring soon'    => array( 'jetpack_scan--plan_expiring_soon', 'jetpack_scan--plan_expiring_soon_dismissed' ),
			'plugins need installs' => array( 'jetpack_complete--plugins_needing_installed_activated', 'jetpack_complete--plugins_needing_installed_dismissed' ),
		);
	}

	/**
	 * The REST route serves the cached alerts, leaving out only the ones this request dismisses.
	 *
	 * @param string $slug   The alert.
	 * @param string $cookie The cookie that dismisses it.
	 *
	 * @dataProvider provide_dismissible_alerts
	 */
	#[DataProvider( 'provide_dismissible_alerts' )]
	public function test_rest_route_reads_the_cache_and_applies_dismissals_after( $slug, $cookie ) {
		$this->log_in_as( 'administrator' );
		$computations = $this->add_alert_and_count_computations( $slug );

		$this->assertArrayHasKey( $slug, $this->fetch_alerts_over_rest() );
		$this->assertArrayNotHasKey( $slug, $this->fetch_alerts_over_rest( array( "$cookie=1" ) ) );
		$this->assertArrayHasKey( $slug, $this->fetch_alerts_over_rest(), 'A dismissal must not reach the cache.' );
		$this->assertSame( 1, $computations['count'] );
	}

	/**
	 * Data provider for test_cached_alerts_are_recomputed_when_their_inputs_change.
	 *
	 * @return array
	 */
	public static function provide_alert_input_changes() {
		return array(
			'purchases change'  => array( 'purchases' ),
			'plugin installed'  => array( 'upgrader' ),
			'plugin deleted'    => array( 'deleted_plugin' ),
			'scan status'       => array( 'scan_status' ),
			'plugin activated'  => array( 'active_plugins' ),
			'site disconnected' => array( 'disconnect' ),
			'another user'      => array( 'user' ),
		);
	}

	/**
	 * A change to what the alerts are computed from shows new alerts on the next request.
	 *
	 * @param string $change The change to make.
	 *
	 * @dataProvider provide_alert_input_changes
	 */
	#[DataProvider( 'provide_alert_input_changes' )]
	public function test_cached_alerts_are_recomputed_when_their_inputs_change( $change ) {
		$this->log_in_as( 'administrator' );
		$computations = $this->add_alert_and_count_computations( 'test_alert' );

		$alerts = $this->fetch_alerts_over_rest();
		$this->assertSame( $alerts, $this->fetch_alerts_over_rest() );
		$this->assertSame( 1, $computations['count'] );

		switch ( $change ) {
			case 'purchases':
				$purchase = (object) array(
					'product_slug'  => 'jetpack_scan',
					'expiry_status' => 'active',
					'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
				);
				set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array( $purchase ), HOUR_IN_SECONDS );
				break;
			case 'upgrader':
				do_action( 'upgrader_process_complete', null, array( 'type' => 'plugin' ) );
				break;
			case 'scan_status':
				update_option( 'jetpack_scan_status', maybe_serialize( (object) array( 'threats' => array() ) ) );
				break;
			case 'deleted_plugin':
				do_action( 'deleted_plugin', 'jetpack-boost/jetpack-boost.php', true );
				break;
			case 'active_plugins':
				update_option( 'active_plugins', array( 'jetpack-boost/jetpack-boost.php' ) );
				break;
			case 'disconnect':
				( new Tokens() )->delete_all();
				( new Connection_Manager() )->reset_connection_status();
				break;
			case 'user':
				$this->log_in_as( 'editor' );
				break;
		}

		$this->fetch_alerts_over_rest();
		$this->assertSame( 2, $computations['count'] );
	}

	/**
	 * Data provider for test_alerts_that_may_be_incomplete_or_stale_are_cached_briefly.
	 *
	 * @return array
	 */
	public static function provide_cache_lifetimes() {
		return array(
			'requests succeeded'      => array( 'test_alert', null, HOUR_IN_SECONDS ),
			'a request failed'        => array( 'test_alert', new \WP_Error( 'http_request_failed', 'Timed out' ), 5 * MINUTE_IN_SECONDS ),
			'a request was refused'   => array( 'test_alert', array( 'response' => array( 'code' => 500 ) ), 5 * MINUTE_IN_SECONDS ),
			'a backup failure showed' => array( 'backup_failure', null, 5 * MINUTE_IN_SECONDS ),
		);
	}

	/**
	 * Alerts computed after a failed request, or showing a backup failure, are recomputed after minutes rather than an hour.
	 *
	 * @param string               $slug     The alert to add.
	 * @param array|\WP_Error|null $response A response to a request made while collecting the alerts.
	 * @param int                  $lifetime The expected cache lifetime, in seconds.
	 *
	 * @dataProvider provide_cache_lifetimes
	 */
	#[DataProvider( 'provide_cache_lifetimes' )]
	public function test_alerts_that_may_be_incomplete_or_stale_are_cached_briefly( $slug, $response, $lifetime ) {
		$this->log_in_as( 'administrator' );
		$this->add_alert_and_count_computations( $slug );
		if ( null !== $response ) {
			add_filter(
				'my_jetpack_red_bubble_notification_slugs',
				function ( $alerts ) use ( $response ) {
					do_action( 'http_api_debug', $response, 'response', 'WpOrg\Requests\Requests', array(), 'https://public-api.wordpress.com/rest/v1.2/upgrades' );
					return $alerts;
				}
			);
		}

		$this->fetch_alerts_over_rest();

		$expires = (int) get_option( '_transient_timeout_' . Red_Bubble_Notifications::get_cache_key() );
		$this->assertEqualsWithDelta( time() + $lifetime, $expires, 5 );
	}
}
