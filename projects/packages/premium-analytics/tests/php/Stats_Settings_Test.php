<?php
/**
 * Tests for Stats_Settings.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use ReflectionProperty;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Stats_Settings
 */
#[CoversClass( Stats_Settings::class )]
class Stats_Settings_Test extends BaseTestCase {

	const ROUTE = '/wp/v2/settings';

	const GROUP = 'jetpack_premium_analytics';

	const READER_VIEWS_OPTION = 'wpcom_reader_views_enabled';

	/**
	 * Users per role, as `count_users()` reports them. WorDBless has no users table to count.
	 *
	 * @var array
	 */
	private $role_counts = array();

	/**
	 * Stand up core's settings route with the Stats settings on it, as Enablement_Setting_Test does.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Stats_Settings::configure();
		add_action( 'rest_api_init', array( $this, 'register_core_settings_route' ), 99 );
		do_action( 'rest_api_init' );
		$this->reset_stats_options_cache();
		add_filter( 'pre_count_users', array( $this, 'count_users' ) );
	}

	/**
	 * Answer `count_users()` from `$role_counts`.
	 *
	 * @return array The counts, shaped as `count_users()` returns them.
	 */
	public function count_users() {
		return array(
			'total_users' => array_sum( $this->role_counts ),
			'avail_roles' => $this->role_counts,
		);
	}

	/**
	 * Drop the Stats package's per-request copy of the option, which would otherwise carry across tests.
	 *
	 * @return void
	 */
	private function reset_stats_options_cache() {
		$options = new ReflectionProperty( Stats_Options::class, 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$options->setValue( null, array() );
	}

	/**
	 * Register core's settings route, at the priority core itself uses.
	 *
	 * @return void
	 */
	public function register_core_settings_route() {
		( new \WP_REST_Settings_Controller() )->register_routes();
	}

	/**
	 * Drop the options and everything the test hooked up.
	 */
	public function tear_down() {
		delete_option( Stats_Options::OPTION_NAME );
		delete_option( self::READER_VIEWS_OPTION );
		unregister_setting( self::GROUP, Stats_Options::OPTION_NAME );
		unregister_setting( self::GROUP, self::READER_VIEWS_OPTION );
		remove_action( 'rest_api_init', array( Stats_Settings::class, 'register' ) );
		remove_action( 'rest_api_init', array( $this, 'register_core_settings_route' ), 99 );
		remove_filter( 'rest_pre_get_setting', array( Stats_Settings::class, 'get_stats_options' ) );
		remove_filter( 'rest_pre_update_setting', array( Stats_Settings::class, 'update_stats_options' ) );
		remove_filter( 'rest_request_after_callbacks', array( Stats_Settings::class, 'report_update_error' ) );
		remove_all_filters( 'pre_update_option_' . Stats_Options::OPTION_NAME );
		remove_all_filters( 'pre_update_option_' . self::READER_VIEWS_OPTION );
		remove_all_filters( 'wp_is_large_user_count' );
		$this->reset_stats_options_cache();
		remove_filter( 'jetpack_admin_js_script_data', array( Stats_Settings::class, 'add_script_data' ), 20 );
		Constants::clear_single_constant( 'IS_WPCOM' );
		remove_filter( 'pre_count_users', array( $this, 'count_users' ) );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Log in as a user holding a given role.
	 *
	 * @param string $role Role to grant.
	 * @return void
	 */
	private function log_in_as( string $role ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'stats-' . $role,
					'user_pass'  => 'password',
					'role'       => $role,
				)
			)
		);
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

	public function test_route_reads_only_the_editable_fields_of_the_stored_option() {
		$this->log_in_as( 'administrator' );
		update_option(
			Stats_Options::OPTION_NAME,
			array(
				'admin_bar'   => false,
				'roles'       => array( 'administrator', 'editor' ),
				'count_roles' => array(),
				'notices'     => array( 'opt_in_new_stats' => true ),
				'version'     => 9,
			)
		);

		$data = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) )->get_data();

		$this->assertSame(
			array(
				'admin_bar'   => false,
				'roles'       => array( 'administrator', 'editor' ),
				'count_roles' => array(),
			),
			$data[ Stats_Options::OPTION_NAME ]
		);
	}

	public function test_write_keeps_the_stats_state_it_does_not_send() {
		$this->log_in_as( 'administrator' );
		update_option(
			Stats_Options::OPTION_NAME,
			array(
				'admin_bar' => true,
				'notices'   => array( 'opt_in_new_stats' => true ),
				'version'   => 9,
			)
		);

		$this->post_settings( array( Stats_Options::OPTION_NAME => array( 'admin_bar' => false ) ) );

		$stored = get_option( Stats_Options::OPTION_NAME );
		$this->assertFalse( $stored['admin_bar'] );
		$this->assertSame( array( 'opt_in_new_stats' => true ), $stored['notices'] );
	}

	public function test_write_refuses_a_role_the_site_does_not_have() {
		$this->log_in_as( 'administrator' );

		$response = $this->post_settings( array( Stats_Options::OPTION_NAME => array( 'roles' => array( 'administrator', 'ghost' ) ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertFalse( get_option( Stats_Options::OPTION_NAME ) );
	}

	public function test_route_reads_back_a_stored_role_the_site_no_longer_has() {
		$this->log_in_as( 'administrator' );
		update_option( Stats_Options::OPTION_NAME, array( 'roles' => array( 'administrator', 'retired' ) ) );
		// The schema is built on registration, as on a request after the role was removed.
		unregister_setting( self::GROUP, Stats_Options::OPTION_NAME );
		Stats_Settings::register();

		$data = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) )->get_data();

		$this->assertSame( array( 'administrator', 'retired' ), $data[ Stats_Options::OPTION_NAME ]['roles'] );
	}

	public function test_write_the_site_does_not_store_answers_with_an_error() {
		$this->log_in_as( 'administrator' );
		update_option( Stats_Options::OPTION_NAME, array( 'admin_bar' => true ) );
		add_filter(
			'pre_update_option_' . Stats_Options::OPTION_NAME,
			function ( $value, $old_value ) {
				return $old_value;
			},
			10,
			2
		);

		$response = $this->post_settings( array( Stats_Options::OPTION_NAME => array( 'admin_bar' => false ) ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertTrue( get_option( Stats_Options::OPTION_NAME )['admin_bar'] );
	}

	public function test_write_moving_a_retired_role_to_the_other_field_answers_with_an_error() {
		$this->log_in_as( 'administrator' );
		update_option( Stats_Options::OPTION_NAME, array( 'roles' => array( 'administrator', 'retired' ) ) );
		// The route's schema is built on `rest_api_init`, as on a request after the role was removed.
		unregister_setting( self::GROUP, Stats_Options::OPTION_NAME );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init' );

		$response = $this->post_settings( array( Stats_Options::OPTION_NAME => array( 'count_roles' => array( 'retired' ) ) ) );

		$this->assertSame( 400, $response->get_status() );
	}

	public function test_reader_views_switched_off_read_back_as_off() {
		$this->log_in_as( 'administrator' );

		$data = $this->post_settings( array( self::READER_VIEWS_OPTION => false ) )->get_data();

		$this->assertFalse( $data[ self::READER_VIEWS_OPTION ] );
		$this->assertSame( 0, get_option( self::READER_VIEWS_OPTION ) );
	}

	public function test_reader_views_write_the_site_does_not_store_answers_with_an_error() {
		$this->log_in_as( 'administrator' );
		update_option( self::READER_VIEWS_OPTION, 1 );
		add_filter(
			'pre_update_option_' . self::READER_VIEWS_OPTION,
			function ( $value, $old_value ) {
				return $old_value;
			},
			10,
			2
		);

		$response = $this->post_settings( array( self::READER_VIEWS_OPTION => false ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 1, get_option( self::READER_VIEWS_OPTION ) );
	}

	public function test_settings_are_not_exposed_on_a_simple_site() {
		Constants::set_constant( 'IS_WPCOM', true );
		unregister_setting( self::GROUP, Stats_Options::OPTION_NAME );
		remove_action( 'rest_api_init', array( Stats_Settings::class, 'register' ) );

		Stats_Settings::configure();
		do_action( 'rest_api_init' );

		$this->assertArrayNotHasKey( Stats_Options::OPTION_NAME, get_registered_settings() );
	}

	public function test_script_data_lists_the_roles_and_their_user_counts_for_an_administrator() {
		$this->log_in_as( 'administrator' );
		$this->role_counts = array( 'editor' => 3 );

		$context = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings'];

		$this->assertContains(
			array(
				'slug'  => 'editor',
				'name'  => 'Editor',
				'count' => 3,
			),
			$context['roles']
		);
		$this->assertNull( $context['features_url'] );
	}

	public function test_script_data_leaves_out_user_counts_on_a_large_site() {
		$this->log_in_as( 'administrator' );
		$this->role_counts = array( 'editor' => 3 );
		add_filter( 'wp_is_large_user_count', '__return_true' );

		$context = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings'];

		$this->assertNull( $context['roles'][0]['count'] );
	}

	public function test_script_data_carries_nothing_for_a_user_who_cannot_manage_options() {
		$this->log_in_as( 'editor' );

		$this->assertSame( array(), Stats_Settings::add_script_data( array() ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_links_to_the_stats_feature_when_my_jetpack_is_registered() {
		require_once __DIR__ . '/mocks/jetpack-plugin-mock.php';
		$this->log_in_as( 'administrator' );
		$without_my_jetpack = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings'];
		add_submenu_page( 'jetpack', 'My Jetpack', 'My Jetpack', 'manage_options', 'my-jetpack', '__return_null' );

		$context = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings'];

		$this->assertNull( $without_my_jetpack['features_url'] );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack#/features?search=stats' ), $context['features_url'] );
	}
}
