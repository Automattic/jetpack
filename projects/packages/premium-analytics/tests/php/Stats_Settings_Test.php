<?php
/**
 * Tests for Stats_Settings.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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

	const CONSENT_API_FILE = WP_PLUGIN_DIR . '/wp-consent-api/wp-consent-api.php';

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
	 * Deny the per-plugin activation check, as a network or host policy can.
	 *
	 * @param string[] $caps The primitive caps the meta cap maps to.
	 * @param string   $cap  The meta cap being checked.
	 * @return string[]
	 */
	public function deny_activate_plugin( $caps, $cap ) {
		return 'activate_plugin' === $cap ? array( 'do_not_allow' ) : $caps;
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
		remove_all_filters( 'file_mod_allowed' );
		remove_filter( 'map_meta_cap', array( $this, 'deny_activate_plugin' ) );
		if ( file_exists( self::CONSENT_API_FILE ) ) {
			unlink( self::CONSENT_API_FILE ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			rmdir( dirname( self::CONSENT_API_FILE ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}
		delete_option( 'active_plugins' );
		remove_all_filters( Stats_Settings::FIELDS_FILTER );
		$this->reset_stats_options_cache();
		remove_filter( 'jetpack_admin_js_script_data', array( Stats_Settings::class, 'add_script_data' ), 20 );
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
	 * Keep only some settings, as a host does, and rebuild the route's schema from them.
	 *
	 * @param string[] $fields Settings to keep.
	 * @return void
	 */
	private function keep_fields( array $fields ) {
		add_filter(
			Stats_Settings::FIELDS_FILTER,
			function () use ( $fields ) {
				return $fields;
			}
		);
		unregister_setting( self::GROUP, Stats_Options::OPTION_NAME );
		unregister_setting( self::GROUP, self::READER_VIEWS_OPTION );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init' );
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

	public function test_route_offers_only_the_fields_the_host_keeps() {
		$this->log_in_as( 'administrator' );
		update_option( Stats_Options::OPTION_NAME, array( 'roles' => array( 'administrator', 'editor' ) ) );
		$this->keep_fields( array( 'admin_bar' ) );

		$data   = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) )->get_data();
		$status = $this->post_settings( array( Stats_Options::OPTION_NAME => array( 'roles' => array( 'administrator' ) ) ) )->get_status();

		$this->assertSame( array( 'admin_bar' => true ), $data[ Stats_Options::OPTION_NAME ] );
		$this->assertArrayNotHasKey( self::READER_VIEWS_OPTION, $data );
		$this->assertSame( 400, $status );
		$this->assertSame( array( 'administrator', 'editor' ), get_option( Stats_Options::OPTION_NAME )['roles'] );
	}

	public function test_script_data_lists_the_fields_the_host_keeps_without_roles() {
		$this->log_in_as( 'administrator' );
		$this->keep_fields( array( 'admin_bar', self::READER_VIEWS_OPTION ) );

		$context = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings'];

		$this->assertSame( array( 'admin_bar', self::READER_VIEWS_OPTION ), $context['fields'] );
		$this->assertSame( array(), $context['roles'] );
	}

	public function test_script_data_carries_nothing_when_the_host_keeps_no_field() {
		$this->log_in_as( 'administrator' );
		add_filter( Stats_Settings::FIELDS_FILTER, '__return_empty_array' );

		$this->assertSame( array(), Stats_Settings::add_script_data( array() ) );
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
	 * Active plugins and the banner the consent card names for them.
	 *
	 * @return array
	 */
	public static function banner_plugin_provider() {
		return array(
			'CookieYes'             => array( array( 'akismet/akismet.php', 'cookie-law-info/cookie-law-info.php' ), 'CookieYes' ),
			'Complianz premium'     => array( array( 'complianz-gdpr-premium/complianz-gpdr-premium.php' ), 'Complianz' ),
			'one only listed'       => array( array( 'gdpr-cookie-compliance/moove-gdpr.php' ), 'GDPR Cookie Compliance' ),
			'a lookalike directory' => array( array( 'cookie-law-info-extra/cookie-law-info.php' ), null ),
			'no banner plugin'      => array( array( 'akismet/akismet.php' ), null ),
		);
	}

	/**
	 * @dataProvider banner_plugin_provider
	 *
	 * @param string[]    $active_plugins Active plugin files.
	 * @param string|null $expected       The banner plugin the card names.
	 */
	#[DataProvider( 'banner_plugin_provider' )]
	public function test_script_data_names_the_active_banner_plugin( array $active_plugins, $expected ) {
		$this->log_in_as( 'administrator' );
		update_option( 'active_plugins', $active_plugins );

		$consent = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertSame( $expected, $consent['banner_plugin'] );
	}

	public function test_script_data_sees_a_banner_that_declares_its_consent_type_before_wp_consent_api_is_active() {
		$this->log_in_as( 'administrator' );
		add_filter( 'wp_get_consent_type', fn() => 'optin' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

		$consent = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertFalse( $consent['api_active'] );
		$this->assertTrue( $consent['consent_type_declared'] );
	}

	public function test_script_data_says_when_file_mods_rule_out_installing() {
		$this->log_in_as( 'administrator' );
		$allowed = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];
		add_filter( 'file_mod_allowed', '__return_false' );

		$disallowed = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertTrue( $allowed['can_install'] );
		$this->assertTrue( $allowed['file_mods_allowed'] );
		$this->assertFalse( $disallowed['can_install'] );
		$this->assertFalse( $disallowed['file_mods_allowed'] );
	}

	public function test_script_data_reports_an_installed_but_inactive_wp_consent_api() {
		$this->log_in_as( 'administrator' );
		$missing = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];
		mkdir( dirname( self::CONSENT_API_FILE ), 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( self::CONSENT_API_FILE, '<?php' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$installed = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertFalse( $missing['api_installed'] );
		$this->assertTrue( $installed['api_installed'] );
		$this->assertFalse( $installed['api_active'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_reports_an_active_wp_consent_api_and_the_banner_behind_it() {
		require_once __DIR__ . '/mocks/wp-consent-api-mock.php';
		$this->log_in_as( 'administrator' );
		$without_banner = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];
		add_filter( 'wp_get_consent_type', fn() => 'optin' );

		$consent = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertTrue( $consent['api_active'] );
		$this->assertFalse( $without_banner['consent_type_declared'] );
		$this->assertTrue( $consent['consent_type_declared'] );
		$this->assertNull( $consent['banner_plugin'] );
	}

	public function test_script_data_says_when_the_user_cannot_activate_wp_consent_api() {
		$this->log_in_as( 'administrator' );
		add_filter( 'map_meta_cap', array( $this, 'deny_activate_plugin' ), 10, 2 );

		$consent = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertTrue( $consent['can_install'] );
		$this->assertFalse( $consent['can_activate'] );
	}

	/**
	 * Complianz's Jetpack integration and cookie blocker, and whether the card hears that Complianz blocks Stats.
	 *
	 * @return array
	 */
	public static function complianz_provider() {
		return array(
			'integration and blocker on' => array( true, true, true ),
			'integration off'            => array( false, true, false ),
			'blocker off'                => array( true, false, false ),
		);
	}

	/**
	 * @dataProvider complianz_provider
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $integration Whether Complianz's Jetpack integration is enabled.
	 * @param bool $blocker     Whether Complianz's cookie blocker runs on the front end.
	 * @param bool $expected    Whether the card hears that Complianz blocks Stats.
	 */
	#[DataProvider( 'complianz_provider' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_says_when_complianz_blocks_stats( $integration, $blocker, $expected ) {
		require_once __DIR__ . '/mocks/complianz-mock.php';
		$GLOBALS['cmplz_mock'] = array(
			'integration' => $integration,
			'blocker'     => $blocker,
		);
		$this->log_in_as( 'administrator' );

		$consent = Stats_Settings::add_script_data( array() )['premium_analytics']['stats_settings']['consent'];

		$this->assertSame( $expected, $consent['banner_blocks_stats'] );
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
