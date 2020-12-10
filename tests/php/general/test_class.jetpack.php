<?php

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Status;

// Extend with a public constructor so that can be mocked in tests
class MockJetpack extends Jetpack {

	/**
	 * Holds the singleton instance of this class
	 *
	 * @var MockJetpack
	 */
	public static $instance = false;

	/**
	 * We are redefining this to overcome the lack of late static binding in the parent Jetpack class.
	 *
	 * @static
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function __construct() {
		$this->connection_manager = new Connection_Manager();
	}
}

class MockJetpack_XMLRPC_Server extends Jetpack_XMLRPC_Server {
	private $mockLoginUser = false;

	public function __construct( $user ) {
		$this->mockLoginUser = $user;
	}

	public function login() {
		return $this->mockLoginUser;
	}
}

class WP_Test_Jetpack extends WP_UnitTestCase {
	static $admin_id = 0;

	static $activated_modules = array();
	static $deactivated_modules = array();

	public static function wpSetupBeforeClass() {
		self::$admin_id = self::factory()->user->create( array(
			'role' => 'administrator',
		) );
	}

	public function tearDown() {
		parent::tearDown();
		Constants::clear_constants();
	}

	/**
	 * Make sure that MockJetpack creates separate instances of `Jetpack` and `Automattic\Jetpack\Connection\Manager`.
	 */
	public function test_static_binding() {
		$this->assertNotEquals( spl_object_hash( MockJetpack::init() ), spl_object_hash( Jetpack::init() ) );
		$this->assertNotEquals( spl_object_hash( MockJetpack::connection() ), spl_object_hash( Jetpack::connection() ) );
	}

	/**
	 * @author blobaugh
	 * @covers Jetpack::init
	 * @since 2.3.3
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack', Jetpack::init() );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 * @since 3.2
	 */
	public function test_sort_modules_with_equal_sort_values() {

		$first_file  = array( 'sort' => 5 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );

		$this->assertEquals( 0, $sort_value );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 * @since 3.2
	 */
	public function test_sort_modules_with_different_sort_values() {

		$first_file  = array( 'sort' => 10 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );
		$reversed_sort_value = Jetpack::sort_modules( $second_file, $first_file );

		$this->assertEquals( 1, $sort_value );
		$this->assertEquals( -1, $reversed_sort_value );
	}

	/**
	 * @author georgestephanis
	 * @covers Jetpack::absolutize_css_urls
	 */
	public function test_absolutize_css_urls_properly_handles_use_cases() {

		$css = <<<CSS
.test-it {
	background: url(same-dir.png);
	background: url('same-dir.png');
	background: url("same-dir.png");
	background: url( same-dir.png );
	background: url( 'same-dir.png' );
	background: url( "same-dir.png" );
	background: url(		same-dir.png		);
	background: url(		'same-dir.png'	);
	background: url(		"same-dir.png"	);
	background: url(./same-dir.png);
	background: url(down/down-dir.png);
	background: url(../up-dir.png);
	background: url(../../up-2-dirs.png);
	background: url(/at-root.png);
	background: url(//other-domain.com/root.png);
	background: url(https://other-domain.com/root.png);
	background: url(data:image/gif;base64,eh129ehiuehjdhsa==);
}
CSS;

		$expected = <<<EXPECTED
.test-it {
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/./same-dir.png");
	background: url("http://example.com/dir1/dir2/down/down-dir.png");
	background: url("http://example.com/dir1/dir2/../up-dir.png");
	background: url("http://example.com/dir1/dir2/../../up-2-dirs.png");
	background: url("http://example.com/at-root.png");
	background: url(//other-domain.com/root.png);
	background: url(https://other-domain.com/root.png);
	background: url(data:image/gif;base64,eh129ehiuehjdhsa==);
}
EXPECTED;

		$result = Jetpack::absolutize_css_urls( $css, 'http://example.com/dir1/dir2/style.css' );
		$this->assertEquals( $expected, $result );

	}

	/*
	 * @author tonykova
	 * @covers Jetpack::implode_frontend_css
	 */
	public function test_implode_frontend_css_enqueues_bundle_file_handle() {
		global $wp_styles;
		$wp_styles = new WP_styles();

		add_filter( 'jetpack_implode_frontend_css', '__return_true' );

		if ( ! file_exists( plugins_url( 'jetpack-carousel.css', __FILE__ ) ) ) {
			$this->markTestSkipped( 'Required CSS file not found.' );
		}

		// Enqueue some script on the $to_dequeue list
		$style_handle = 'jetpack-carousel';
		wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ) );

		Jetpack::init()->implode_frontend_css( true );

		$seen_bundle = false;
		foreach ( $wp_styles->registered as $handle => $handle_obj ) {
			if ( $style_handle === $handle ) {
				$expected = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? "<!-- `{$style_handle}` is included in the concatenated jetpack.css -->\r\n" : '';
				$this->assertEquals( $expected, get_echo( array( $wp_styles, 'do_item' ), array( $handle ) ) );
			} elseif ( 'jetpack_css' === $handle ) {
				$seen_bundle = true;
			}
		}

		$this->assertTrue( $seen_bundle );
	}

	/**
	 * @author tonykova
	 * @covers Jetpack::implode_frontend_css
	 * @since 3.2.0
	 */
	public function test_implode_frontend_css_does_not_enqueue_bundle_when_disabled_through_filter() {
		global $wp_styles;
		$wp_styles = new WP_styles();

		add_filter( 'jetpack_implode_frontend_css', '__return_false' );

		// Enqueue some script on the $to_dequeue list
		$style_handle = 'jetpack-carousel';
		wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ) );

		Jetpack::init()->implode_frontend_css();

		$seen_orig = false;
		foreach ( $wp_styles->registered as $handle => $handle_obj ) {
			$this->assertNotEquals( 'jetpack_css', $handle );
			if ( 'jetpack-carousel' === $handle ) {
				$seen_orig = true;
			}
		}

		$this->assertTrue( $seen_orig );
	}

	public function test_activating_deactivating_modules_fires_actions() {
		self::reset_tracking_of_module_activation();

		add_action( 'jetpack_activate_module', array( __CLASS__, 'track_activated_modules' ) );
		add_action( 'jetpack_deactivate_module', array( __CLASS__, 'track_deactivated_modules' ) );

		Jetpack::update_active_modules( array( 'stats' ) );
		Jetpack::update_active_modules( array( 'stats' ) );
		Jetpack::update_active_modules( array( 'json-api' ) );
		Jetpack::update_active_modules( array( 'json-api' ) );

		$this->assertEquals( self::$activated_modules, array( 'stats', 'json-api' ) );
		$this->assertEquals(  self::$deactivated_modules, array( 'stats' ) );

		remove_action( 'jetpack_activate_module', array( __CLASS__, 'track_activated_modules' ) );
		remove_action( 'jetpack_deactivate_module', array( __CLASS__, 'track_deactivated_modules' ) );
	}

	public function test_activating_deactivating_modules_fires_specific_actions() {
		self::reset_tracking_of_module_activation();
		add_action( 'jetpack_activate_module_stats', array( __CLASS__, 'track_activated_modules' ) );
		add_action( 'jetpack_deactivate_module_stats', array( __CLASS__, 'track_deactivated_modules' ) );

		Jetpack::update_active_modules( array( 'stats' ) );
		Jetpack::update_active_modules( array( 'stats' ) );
		Jetpack::update_active_modules( array( 'json-api' ) );
		Jetpack::update_active_modules( array( 'json-api' ) );

		$this->assertEquals( self::$activated_modules, array( 'stats' ) );
		$this->assertEquals(  self::$deactivated_modules, array( 'stats' ) );

		remove_action( 'jetpack_activate_module_stats', array( __CLASS__, 'track_activated_modules' ) );
		remove_action( 'jetpack_deactivate_module_stats', array( __CLASS__, 'track_deactivated_modules' ) );
	}

	public function test_active_modules_filter_restores_state() {
		self::reset_tracking_of_module_activation();

		add_action( 'jetpack_activate_module', array( __CLASS__, 'track_activated_modules' ) );
		add_action( 'jetpack_deactivate_module', array( __CLASS__, 'track_deactivated_modules' ) );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'e2e_test_filter' ) );

		Jetpack::update_active_modules( array( 'monitor' ) );
		$this->assertEquals( self::$activated_modules, array( 'monitor' ) );
		$this->assertEquals(  self::$deactivated_modules, array() );

		// Simce we override the 'monitor' module, verify it does not appear in get_active_modules().
		$active_modules = Jetpack::get_active_modules();
		$this->assertEquals(  $active_modules, array() );

		// Verify that activating a new module does not deactivate 'monitor' module.
		Jetpack::update_active_modules( array( 'stats' ) );
		$this->assertEquals( self::$activated_modules, array( 'monitor', 'stats') );
		$this->assertEquals(  self::$deactivated_modules, array() );

		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'e2e_test_filter' ) );

		// With the module override filter removed, verify that monitor module appears in get_active_modules().
		$active_modules = Jetpack::get_active_modules();
		$this->assertEquals(  $active_modules, array( 'monitor', 'stats' ) );
	}

	 // This filter overrides the 'monitor' module.
	public static function e2e_test_filter( $modules ) {
		$disabled_modules = array( 'monitor' );

		foreach ( $disabled_modules as $module_slug ) {
			$found = array_search( $module_slug, $modules );
			if ( false !== $found ) {
				unset( $modules[ $found ] );
			}
		}

		return $modules;
	}

	public function test_get_other_linked_admins_one_admin_returns_false() {
		delete_transient( 'jetpack_other_linked_admins' );
		$other_admins = Jetpack::get_other_linked_admins();
		$this->assertFalse( $other_admins );
		$this->assertEquals( 0, get_transient( 'jetpack_other_linked_admins' ) );
	}

	public function test_get_other_linked_admins_more_than_one_not_false() {
		delete_transient( 'jetpack_other_linked_admins' );
		$master_user = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$connected_admin = $this->factory->user->create( array( 'role' => 'administrator' ) );

		Jetpack_Options::update_option( 'master_user', $master_user );
		Jetpack_Options::update_option( 'user_tokens', array(
			$connected_admin => 'apple.a.' . $connected_admin,
			$master_user     => 'kiwi.a.' . $master_user
		) );

		$other_admins = Jetpack::get_other_linked_admins();
		$this->assertInternalType( 'int', $other_admins );
		$this->assertInternalType( 'int', get_transient( 'jetpack_other_linked_admins' ) );
	}

	public function test_promoting_admin_clears_other_linked_admins_transient() {
		set_transient( 'jetpack_other_linked_admins', 2, HOUR_IN_SECONDS );
		$editor_user = $this->factory->user->create( array( 'role' => 'editor' ) );
		wp_update_user( array( 'ID' => $editor_user, 'role' => 'administrator' ) );

		$this->assertFalse( get_transient( 'jetpack_other_linked_admins' ) );
	}

	public function test_demoting_admin_clear_other_linked_admins_transiet() {
		set_transient( 'jetpack_other_linked_admins', 2, HOUR_IN_SECONDS );
		$admin_user = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_update_user( array( 'ID' => $admin_user, 'role' => 'editor' ) );

		$this->assertFalse( get_transient( 'jetpack_other_linked_admins' ) );
	}

	public function test_null_old_roles_clears_linked_admins_transient() {
		set_transient( 'jetpack_other_linked_admins', 2, HOUR_IN_SECONDS );
		$admin_user = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_update_user( array( 'ID' => $admin_user, 'role' => 'editor' ) );

		/** This action is documented in wp-includes/class-wp-user.php */
		do_action( 'set_user_role', $admin_user, 'contributor' );

		$this->assertFalse( get_transient( 'jetpack_other_linked_admins' ) );
	}

	function test_changing_non_admin_roles_does_not_clear_other_linked_admins_transient() {
		set_transient( 'jetpack_other_linked_admins', 2, HOUR_IN_SECONDS );
		$user_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );

		foreach ( array( 'contributor', 'author', 'editor' ) as $role ) {
			wp_update_user( array( 'ID' => $user_id, 'role' => $role) );
		}

		$this->assertEquals( 2, get_transient( 'jetpack_other_linked_admins' ) );
	}

	function test_other_linked_admins_transient_set_to_zero_returns_false() {
		set_transient( 'jetpack_other_linked_admins', 0, HOUR_IN_SECONDS );
		$this->assertFalse( Jetpack::get_other_linked_admins() );
	}

	function test_idc_optin_default() {
		if ( is_multisite() ) {
			$this->assertFalse( Jetpack::sync_idc_optin() );
		} else {
			$this->assertTrue( Jetpack::sync_idc_optin() );
		}
	}

	function test_idc_optin_filter_overrides_development_version() {
		add_filter( 'jetpack_development_version', '__return_true' );
		add_filter( 'jetpack_sync_idc_optin', '__return_false' );
		$this->assertFalse( Jetpack::sync_idc_optin() );
		remove_filter( 'jetpack_development_version', '__return_true' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_false' );
	}

	function test_idc_optin_casts_to_bool() {
		add_filter( 'jetpack_sync_idc_optin', array( $this, 'return_string_1' ) );
		$this->assertTrue( Jetpack::sync_idc_optin() );
		remove_filter( 'jetpack_sync_idc_optin', array( $this, 'return_string_1' ) );
	}

	function test_idc_optin_true_when_constant_true() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', true );
		$this->assertTrue( Jetpack::sync_idc_optin() );
	}

	function test_idc_optin_false_when_constant_false() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );
		$this->assertFalse( Jetpack::sync_idc_optin() );
	}

	function test_idc_optin_filter_overrides_constant() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', true );
		add_filter( 'jetpack_sync_idc_optin', '__return_false' );
		$this->assertFalse( Jetpack::sync_idc_optin() );
		remove_filter( 'jetpack_sync_idc_optin', '__return_false' );
	}

	function test_sync_error_idc_validation_returns_false_if_no_option() {
		Jetpack_Options::delete_option( 'sync_error_idc' );
		$this->assertFalse( Jetpack::validate_sync_error_idc_option() );
	}

	function test_sync_error_idc_validation_returns_true_when_option_matches_expected() {
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );
		Jetpack_Options::update_option( 'sync_error_idc', Jetpack::get_sync_error_idc_option() );
		$this->assertTrue( Jetpack::validate_sync_error_idc_option() );
		Jetpack_Options::delete_option( 'sync_error_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );
	}

	/**
	 * Verify that validate_sync_error returns false if wpcom_ is set and matches expected.
	 */
	public function test_sync_error_idc_validation_returns_false_when_wpcom_option_matches_expected() {
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );
		$option                  = Jetpack::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = $option['siteurl'];
		Jetpack_Options::update_option( 'sync_error_idc', $option );
		$this->assertFalse( Jetpack::validate_sync_error_idc_option() );

		// Verify the migrate_for_idc is set.
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );
	}

	/**
	 * Verify that validate_sync_error returns true if wpcom_ is set and does not match.
	 */
	public function test_sync_error_idc_validation_returns_true_when_wpcom_option_does_not_match_expected() {
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );
		$option                  = Jetpack::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = 'coolrunnings.test';
		Jetpack_Options::update_option( 'sync_error_idc', $option );
		$this->assertTrue( Jetpack::validate_sync_error_idc_option() );

		// Verify the migrate_for_idc is not set.
		$this->assertNotTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );
	}

	function test_sync_error_idc_validation_cleans_up_when_validation_fails() {
		Jetpack_Options::update_option( 'sync_error_idc', array(
			'home'    => 'coolsite.com/',
			'siteurl' => 'coolsite.com/wp/',
		) );

		$this->assertFalse( Jetpack::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	function test_sync_error_idc_validation_cleans_up_when_part_of_validation_fails() {
		$test = Jetpack::get_sync_error_idc_option();
		$test['siteurl'] = 'coolsite.com/wp/';
		Jetpack_Options::update_option( 'sync_error_idc', $test );

		$this->assertFalse( Jetpack::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	function test_sync_error_idc_validation_returns_false_and_cleans_up_when_opted_out() {
		Jetpack_Options::update_option( 'sync_error_idc', Jetpack::get_sync_error_idc_option() );
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );

		$this->assertFalse( Jetpack::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	function test_is_staging_site_true_when_sync_error_idc_is_valid() {
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
		$this->assertTrue( ( new Status() )->is_staging_site() );
		remove_filter( 'jetpack_sync_error_idc_validation', '__return_false' );
	}

	function test_is_dev_version_true_with_alpha() {
		Constants::set_constant( 'JETPACK__VERSION', '4.3.1-alpha' );
		$this->assertTrue( Jetpack::is_development_version() );
	}

	function test_is_dev_version_true_with_beta() {
		Constants::set_constant( 'JETPACK__VERSION', '4.3-beta2' );
		$this->assertTrue( Jetpack::is_development_version() );
	}

	function test_is_dev_version_true_with_rc() {
		Constants::set_constant( 'JETPACK__VERSION', '4.3-rc2' );
		$this->assertTrue( Jetpack::is_development_version() );
	}

	function test_is_dev_version_false_with_number_dot_number() {
		Constants::set_constant( 'JETPACK__VERSION', '4.3' );
		$this->assertFalse( Jetpack::is_development_version() );
	}

	function test_is_dev_version_false_with_number_dot_number_dot_number() {
		Constants::set_constant( 'JETPACK__VERSION', '4.3.1' );
		$this->assertFalse( Jetpack::is_development_version() );
	}

	/**
	 * Tests is_offline_mode filter.
	 *
	 * @covers \Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_filter() {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		$this->assertTrue( ( new Status() )->is_offline_mode() );
		remove_filter( 'jetpack_offline_mode', '__return_true' );
	}

	/**
	 * Tests is_offline_mode filter's bool type casting.
	 *
	 * @covers \Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_bool() {
		add_filter( 'jetpack_offline_mode', '__return_zero' );
		$this->assertFalse( ( new Status() )->is_offline_mode() );
		remove_filter( 'jetpack_offline_mode', '__return_zero' );
	}

	function test_get_sync_idc_option_sanitizes_out_www_and_protocol() {
		$original_home    = get_option( 'home' );
		$original_siteurl = get_option( 'siteurl' );

		update_option( 'home', 'http://www.coolsite.com' );
		update_option( 'siteurl', 'http://www.coolsite.com/wp' );

		$expected = array(
			'home' => 'coolsite.com/',
			'siteurl' => 'coolsite.com/wp/'
		);

		$this->assertSame( $expected, Jetpack::get_sync_error_idc_option() );

		// Cleanup
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );
	}

	function test_get_sync_idc_option_with_ip_address_in_option() {
		$original_home    = get_option( 'home' );
		$original_siteurl = get_option( 'siteurl' );

		update_option( 'home', 'http://72.182.131.109/~wordpress' );
		update_option( 'siteurl', 'http://72.182.131.109/~wordpress/wp' );

		$expected = array(
			'home' => '72.182.131.109/~wordpress/',
			'siteurl' => '72.182.131.109/~wordpress/wp/'
		);

		$this->assertSame( $expected, Jetpack::get_sync_error_idc_option() );

		// Cleanup
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );
	}

	function test_normalize_url_protocol_agnostic_strips_protocol_and_www_for_subdir_subdomain() {
		$url = 'https://www.subdomain.myfaketestsite.com/what';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'subdomain.myfaketestsite.com/what/' === $url_normalized );

		$url = 'http://subdomain.myfaketestsite.com';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'subdomain.myfaketestsite.com/' === $url_normalized );

		$url = 'www.subdomain.myfaketestsite.com';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'subdomain.myfaketestsite.com/' === $url_normalized );
	}

	function test_normalize_url_protocol_agnostic_strips_protocol_and_www_for_normal_urls() {
		$url = 'https://www.myfaketestsite.com';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'myfaketestsite.com/' === $url_normalized );

		$url = 'www.myfaketestsite.com';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'myfaketestsite.com/' === $url_normalized );

		$url = 'myfaketestsite.com';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( 'myfaketestsite.com/' === $url_normalized );
	}

	function test_normalize_url_protocol_agnostic_strips_protocol_for_ip() {
		$url = 'http://123.456.789.0';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( '123.456.789.0/' === $url_normalized );

		$url = '123.456.789.0';
		$url_normalized = Jetpack::normalize_url_protocol_agnostic( $url );
		$this->assertTrue( '123.456.789.0/' === $url_normalized );
	}

	/**
	 * The generate_secrets method should return and store the secret.
	 *
	 * @author zinigor
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_stores_secrets() {
		$secret = Jetpack::generate_secrets( 'name' );

		$this->assertEquals( $secret, Jetpack::get_secrets( 'name', get_current_user_id() ) );
	}

	/**
	 * The generate_secrets method should return the same secret after calling generate several times.
	 *
	 * @author zinigor
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_does_not_regenerate_secrets() {
		$secret = Jetpack::generate_secrets( 'name' );
		$secret2 = Jetpack::generate_secrets( 'name' );
		$secret3 = Jetpack::generate_secrets( 'name' );

		$this->assertEquals( $secret, $secret2 );
		$this->assertEquals( $secret, $secret3 );
		$this->assertEquals( $secret, Jetpack::get_secrets( 'name', get_current_user_id() ) );
	}

	/**
	 * The generate_secrets method should work with filters on wp_generate_password.
	 *
	 * @author zinigor
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_works_with_filters() {
		add_filter( 'random_password', array( __CLASS__, 'cyrillic_salt' ), 20 );
		add_filter( 'random_password', array( __CLASS__, 'kanji_salt' ), 21 );

		$secret = Jetpack::generate_secrets( 'name' );

		$this->assertEquals( $secret, Jetpack::get_secrets( 'name', get_current_user_id() ) );

		remove_filter( 'random_password', array( __CLASS__, 'cyrillic_salt' ), 20 );
		remove_filter( 'random_password', array( __CLASS__, 'kanji_salt' ), 21 );
	}

	/**
	 * The generate_secrets method should work with long strings.
	 *
	 * @author zinigor
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_works_with_long_strings() {
		add_filter( 'random_password', array( __CLASS__, 'multiply_filter' ), 20 );

		$secret = Jetpack::generate_secrets( 'name' );

		$this->assertEquals( $secret, Jetpack::get_secrets( 'name', get_current_user_id() ) );

		remove_filter( 'random_password', array( __CLASS__, 'multiply_filter' ), 20 );
	}

	/**
	 * The get_secrets method should return an error for unknown secrets
	 *
	 * @author roccotripaldi
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_returns_error_for_unknown_secrets() {
		Jetpack::generate_secrets( 'name' );
		$unknown_action = Jetpack::get_secrets( 'unknown', get_current_user_id() );
		$unknown_user_id = Jetpack::get_secrets( 'name', 5 );

		$this->assertInstanceOf( 'WP_Error', $unknown_action );
		$this->assertArrayHasKey( 'verify_secrets_missing', $unknown_action->errors );
		$this->assertInstanceOf( 'WP_Error', $unknown_user_id );
		$this->assertArrayHasKey( 'verify_secrets_missing', $unknown_user_id->errors );
	}

	/**
	 * The get_secrets method should return an error for expired secrets
	 *
	 * @author roccotripaldi
	 * @covers Jetpack::generate_secrets
	 */
	function test_generate_secrets_returns_error_for_expired_secrets() {
		Jetpack::generate_secrets( 'name', get_current_user_id(), -600 );
		$expired = Jetpack::get_secrets( 'name', get_current_user_id() );
		$this->assertInstanceOf( 'WP_Error', $expired );
		$this->assertArrayHasKey( 'verify_secrets_expired', $expired->errors );
	}

	/**
	 * Parse the referer on plugin activation and record the activation source
	 * - featured plugins page
	 * - popular plugins page
	 * - search (with query)
	 * - plugins list
	 * - other
	 */
	function test_get_activation_source() {
		$plugins_url = admin_url( 'plugins.php' );
		$plugin_install_url = admin_url( 'plugin-install.php' );
		$unknown_url = admin_url( 'unknown.php' );

		$this->assertEquals( array( 'list', null ), Jetpack::get_activation_source( $plugins_url . '?plugin_status=all&paged=1&s' ) );
		$this->assertEquals( array( 'featured', null ), Jetpack::get_activation_source( $plugin_install_url ) );
		$this->assertEquals( array( 'popular', null ), Jetpack::get_activation_source( $plugin_install_url . '?tab=popular' ) );
		$this->assertEquals( array( 'recommended', null ), Jetpack::get_activation_source( $plugin_install_url . '?tab=recommended' ) );
		$this->assertEquals( array( 'favorites', null ), Jetpack::get_activation_source( $plugin_install_url . '?tab=favorites' ) );
		$this->assertEquals( array( 'search-term', 'jetpack' ), Jetpack::get_activation_source( $plugin_install_url . '?s=jetpack&tab=search&type=term' ) );
		$this->assertEquals( array( 'search-author', 'foo' ), Jetpack::get_activation_source( $plugin_install_url . '?s=foo&tab=search&type=author' ) );
		$this->assertEquals( array( 'search-tag', 'social' ), Jetpack::get_activation_source( $plugin_install_url . '?s=social&tab=search&type=tag' ) );
		$this->assertEquals( array( 'unknown', null ), Jetpack::get_activation_source( $unknown_url ) );
	}

	/**
	 * @author tyxla
	 * @covers Jetpack::get_assumed_site_creation_date()
	 */
	function test_get_assumed_site_creation_date_user_earliest() {
		$user_id = $this->factory->user->create( array(
			'role'            => 'administrator',
			'user_registered' => '1990-01-01 00:00:00',
		) );
		$post_id = $this->factory->post->create( array(
			'post_date' => '1995-01-01 00:00:00',
		) );

		$jetpack = new MockJetpack();
		$this->assertEquals( '1990-01-01 00:00:00', $jetpack::connection()->get_assumed_site_creation_date() );

		wp_delete_user( $user_id );
		wp_delete_post( $post_id, true );
	}

	/**
	 * @author tyxla
	 * @covers Jetpack::get_assumed_site_creation_date()
	 */
	function test_get_assumed_site_creation_date_post_earliest() {
		$user_id = $this->factory->user->create( array(
			'role'            => 'administrator',
			'user_registered' => '1994-01-01 00:00:00',
		) );
		$post_id = $this->factory->post->create( array(
			'post_date' => '1991-01-01 00:00:00',
		) );

		$jetpack = new MockJetpack();
		$this->assertEquals( '1991-01-01 00:00:00', $jetpack::connection()->get_assumed_site_creation_date() );

		wp_delete_user( $user_id );
		wp_delete_post( $post_id, true );
	}

	/**
	 * @author tyxla
	 * @covers Jetpack::get_assumed_site_creation_date()
	 */
	function test_get_assumed_site_creation_date_only_admins() {
		$admin_id = $this->factory->user->create( array(
			'role'            => 'administrator',
			'user_registered' => '1994-01-01 00:00:00',
		) );
		$editor_id = $this->factory->user->create( array(
			'role'            => 'editor',
			'user_registered' => '1992-01-01 00:00:00',
		) );

		$jetpack = new MockJetpack();
		$this->assertEquals( '1994-01-01 00:00:00', $jetpack::connection()->get_assumed_site_creation_date() );

		wp_delete_user( $admin_id );
		wp_delete_user( $editor_id );
	}

	/**
	 * @author ebinnion
	 * @dataProvider get_file_url_for_environment_data_provider
	 */
	function test_get_file_url_for_environment( $min_path, $non_min_path, $is_script_debug, $expected, $not_expected ) {
		Constants::set_constant( 'SCRIPT_DEBUG', $is_script_debug );
		$file_url = Jetpack::get_file_url_for_environment( $min_path, $non_min_path );

		$this->assertContains( $$expected, $file_url );
		$this->assertNotContains( $$not_expected, $file_url );
	}

	function get_file_url_for_environment_data_provider() {
		return array(
			'script-debug-true' => array(
				'_inc/build/shortcodes/js/recipes.js',
				'modules/shortcodes/js/recipes.js',
				true,
				'non_min_path',
				'min_path'
			),
			'script-debug-false' => array(
				'_inc/build/shortcodes/js/recipes.js',
				'modules/shortcodes/js/recipes.js',
				false,
				'min_path',
				'non_min_path'
			),
		);
	}

	/**
	 * @dataProvider get_content_width_data
	 */
	public function test_get_content_width( $expected, $content_width ) {
		$GLOBALS['content_width'] = $content_width;
		$this->assertSame( $expected, Jetpack::get_content_width() );
	}

	public function get_content_width_data() {
		return array(
			'zero' => array(
				0,
				0,
			),
			'int' => array(
				100,
				100,
			),
			'numeric_string' => array(
				'100',
				'100',
			),
			'non_numeric_string' => array(
				false,
				'meh'
			),
			'content_width_not_set' => array(
				false,
				null,
			),
		);
	}

	/**
	 * Return a Cyrillic salt.
	 *
	 * @param string $password String to add salt to.
	 * @return string
	 */
	public static function cyrillic_salt( $password ) {
		return 'ленка' . $password . 'пенка';
	}

	/**
	 * Return a Kanji salt.
	 *
	 * @param string $password String to add salt to.
	 * @return string
	 */
	public static function kanji_salt( $password ) {
		return '強熊' . $password . '清珠';
	}

	/**
	 * Filter to increase a string length.
	 *
	 * @param string $password String to expand.
	 * @return string
	 */
	public static function multiply_filter( $password ) {
		for ( $i = 0; $i < 10; $i++ ) {
			$password .= $password;
		}
		return $password;
	}

	/**
	 * Return string '1'.
	 *
	 * @return string
	 */
	public function return_string_1() {
		return '1';
	}

	/**
	 * Reset tracking of module activation.
	 */
	public static function reset_tracking_of_module_activation() {
		self::$activated_modules   = array();
		self::$deactivated_modules = array();
	}

	/**
	 * Track activated modules.
	 *
	 * @param mixed $module Module.
	 */
	public static function track_activated_modules( $module ) {
		self::$activated_modules[] = $module;
	}

	/**
	 * Track deactivated modules.
	 *
	 * @param mixed $module Module.
	 */
	public static function track_deactivated_modules( $module ) {
		self::$deactivated_modules[] = $module;
	}

	/**
	 * Mocked `setup_xmlrpc_handlers`.
	 *
	 * @param array         $request_params Incoming request parameters.
	 * @param bool          $is_active Whether the connection is currently active.
	 * @param bool          $is_signed Whether the signature check has been successful.
	 * @param WP_User|false $user User for the mocked Jetpack_XMLRPC_Server.
	 * @return bool
	 */
	private function mocked_setup_xmlrpc_handlers( $request_params, $is_active, $is_signed, $user = false ) {
		$GLOBALS['HTTP_RAW_POST_DATA'] = '';

		Constants::set_constant( 'XMLRPC_REQUEST', true );

		$jetpack       = new MockJetpack();
		$xmlrpc_server = new MockJetpack_XMLRPC_Server( $user );
		return $jetpack::connection()->setup_xmlrpc_handlers( $request_params, $is_active, $is_signed, $xmlrpc_server );
	}

	/**
	 * Asserts that:
	 *   - all of the required xmlrpc methods are in the actual method list.
	 *   - all of the actual xmlrpc methods are in the required or allowed lists.
	 *
	 * @param string[] $required List of XML-RPC methods that must be contained in $actual.
	 * @param string[] $allowed  Additional list of XML-RPC methods that may be contained in $actual.
	 *                           Useful for listing methods that are added by modules that may or may
	 *                           not be active during the test run.
	 * @param string[] $actual   The list of XML-RPC methods.
	 */
	private function assertXMLRPCMethodsComply( $required, $allowed, $actual ) {
		$this->assertEquals( array(), array_diff( $required, $actual ) );
		$this->assertEquals( array(), array_diff( $actual, $required, $allowed ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is active, the request is signed, and without a user.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_active_and_signed_with_no_user() {
		$this->mocked_setup_xmlrpc_handlers( array( 'for' => 'jetpack' ), true, true );

		$methods = apply_filters( 'xmlrpc_methods', array( 'test.test' => '__return_true' ) );

		$required = array(
			'jetpack.verifyAction',
			'jetpack.getUser',
			'jetpack.remoteRegister',
			'jetpack.remoteProvision',
			'jetpack.jsonAPI',
			'jetpack.idcUrlValidation',
			'jetpack.unlinkUser',
			'jetpack.testConnection',
			'jetpack.featuresAvailable',
			'jetpack.featuresEnabled',
		);

		$allowed = array(
			'jetpack.getHeartbeatData',
			'jetpack.syncObject',
			'jetpack.updatePublicizeConnections',
			'jetpack.getBlog',
		);

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is active, the request is signed, and with a user.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_active_and_signed_with_user() {
		$this->mocked_setup_xmlrpc_handlers( array( 'for' => 'jetpack' ), true, true, get_user_by( 'ID', self::$admin_id ) );

		$methods = apply_filters( 'xmlrpc_methods', array( 'test.test' => '__return_true' ) );

		$required = array(
			'jetpack.verifyAction',
			'jetpack.getUser',
			'jetpack.remoteRegister',
			'jetpack.remoteProvision',
			'jetpack.jsonAPI',

			'jetpack.testAPIUserCode',
			'jetpack.disconnectBlog',
			'jetpack.unlinkUser',
			'jetpack.idcUrlValidation',
			'jetpack.testConnection',
			'jetpack.featuresAvailable',
			'jetpack.featuresEnabled',

			'jetpack.syncObject',
		);

		// It's OK if these module-added methods are present (module active in tests).
		// It's OK if they are not (module inactive in tests).
		$allowed = array(
			'jetpack.subscriptions.subscribe',
			'jetpack.updatePublicizeConnections',
			'jetpack.getHeartbeatData',
		);

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is active, the request is signed, with a user,
	 * and with edit methods enabled.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_active_and_signed_with_user_with_edit() {
		$this->mocked_setup_xmlrpc_handlers(
			array( 'for' => 'jetpack' ),
			true,
			true,
			get_user_by( 'ID', self::$admin_id )
		);

		$methods = apply_filters(
			'xmlrpc_methods',
			array(
				'test.test'                 => '__return_true',
				'metaWeblog.editPost'       => '__return_true',
				'metaWeblog.newMediaObject' => '__return_true',
			)
		);

		$required = array(
			'jetpack.verifyAction',
			'jetpack.getUser',
			'jetpack.remoteRegister',
			'jetpack.remoteProvision',
			'jetpack.jsonAPI',

			'jetpack.testAPIUserCode',
			'jetpack.disconnectBlog',
			'jetpack.unlinkUser',
			'jetpack.idcUrlValidation',
			'jetpack.testConnection',
			'jetpack.featuresAvailable',
			'jetpack.featuresEnabled',

			'metaWeblog.newMediaObject',
			'jetpack.updateAttachmentParent',

			'jetpack.syncObject',
		);

		// It's OK if these module-added methods are present (module active in tests).
		// It's OK if they are not (module inactive in tests).
		$allowed = array(
			'jetpack.subscriptions.subscribe',
			'jetpack.updatePublicizeConnections',
			'jetpack.getHeartbeatData',
		);

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is active and the request is not signed.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_active_and_not_signed() {
		$this->mocked_setup_xmlrpc_handlers( array( 'for' => 'jetpack' ), true, false );

		$methods = apply_filters( 'xmlrpc_methods', array( 'test.test' => '__return_true' ) );

		$required = array(
			'jetpack.remoteAuthorize',
		);

		// Nothing else is allowed.
		$allowed = array();

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is not active and the request is not signed.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_not_active_and_not_signed() {
		$this->mocked_setup_xmlrpc_handlers( array( 'for' => 'jetpack' ), false, false );

		$methods = apply_filters( 'xmlrpc_methods', array( 'test.test' => '__return_true' ) );

		$required = array(
			'jetpack.remoteAuthorize',
			'jetpack.remoteRegister',

			'jetpack.verifyRegistration',
		);

		// Nothing else is allowed.
		$allowed = array();

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Tests the setup of the xmlrpc methods when the site is not active and the request is signed.
	 *
	 * @group xmlrpc
	 */
	public function test_classic_xmlrpc_when_not_active_and_signed() {
		$this->mocked_setup_xmlrpc_handlers( array( 'for' => 'jetpack' ), false, true );

		$methods = apply_filters( 'xmlrpc_methods', array( 'test.test' => '__return_true' ) );

		$required = array(
			'jetpack.remoteRegister',
			'jetpack.remoteProvision',
			'jetpack.remoteConnect',
			'jetpack.getUser',
		);

		// Nothing else is allowed.
		$allowed = array();

		$this->assertXMLRPCMethodsComply( $required, $allowed, array_keys( $methods ) );
	}

	/**
	 * Test "wp_getOptions_hook_in_place".
	 *
	 * @see https://github.com/Automattic/jetpack/pull/13514
	 *
	 * @group xmlrpc
	 */
	public function test_wp_getOptions_hook_in_place() {
		$options = apply_filters( 'xmlrpc_blog_options', array() );

		$this->assertArrayHasKey( 'jetpack_version', $options );
	}

	/**
	 * Tests if Partner codes are added to the connect url.
	 *
	 * @dataProvider partner_code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 */
	public function test_partner_codes_are_added_to_authorize_url( $code_type, $option_name, $query_string_name ) {
		$test_code = 'abc-123';
		Partner::init();
		add_filter(
			$option_name,
			function () use ( $test_code ) {
				return $test_code;
			}
		);
		$jetpack = \Jetpack::init();
		$url     = $jetpack->build_authorize_url();

		$parsed_vars = array();
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $parsed_vars );

		$this->assertArrayHasKey( $query_string_name, $parsed_vars );
		$this->assertSame( $test_code, $parsed_vars[ $query_string_name ] );
	}

	/**
	 * Provides code for test_partner_codes_are_added_to_authorize_url.
	 *
	 * @return array
	 */
	public function partner_code_provider() {
		return array(
			'subsidiary_code' =>
				array(
					Partner::SUBSIDIARY_CODE,            // Code type.
					'jetpack_partner_subsidiary_id',     // filter/option key.
					'subsidiaryId',                      // Query string parameter.
				),
			'affiliate_code'  =>
				array(
					Partner::AFFILIATE_CODE,
					'jetpack_affiliate_code',
					'aff',
				),
		);
	}

	/**
	 * Tests login URL only adds redirect param when redirect param is in original request.
	 *
	 * @since 8.4.0
	 * @return void
	 */
	public function test_login_url_add_redirect() {
		$login_url = wp_login_url( '/wp-admin' );
		$this->assertFalse( strpos( $login_url, Jetpack::$jetpack_redirect_login ) );

		$login_url = wp_login_url( '/wp-admin?' . Jetpack::$jetpack_redirect_login . '=true' );
		parse_str( wp_parse_url( $login_url, PHP_URL_QUERY ), $login_parts );
		$this->assertArraySubset( array( Jetpack::$jetpack_redirect_login => 'true' ), $login_parts, true );
	}

	/**
	 * Tests login redirect sending users to Calypso when redirect param is set.
	 *
	 * @since 8.4.0
	 * @return void
	 */
	public function test_login_init_redirect() {
		tests_add_filter(
			'wp_redirect',
			function ( $location ) {
				$expected_location = add_query_arg(
					array(
						'forceInstall' => 1,
						'url'          => rawurlencode( get_site_url() ),
					),
					'https://wordpress.com/jetpack/connect'
				);
				$this->assertEquals( $location, $expected_location );
				throw new Exception(); // Cause an exception, as we don't want to run exit.
			}
		);

		// Remove core filters that add headers.
		remove_filter( 'login_init', 'wp_admin_headers' );
		remove_filter( 'login_init', 'send_frame_options_header' );

		// Run it once and no exception is thrown.
		do_action( 'login_init' );

		$this->expectException( Exception::class );
		$_GET[ Jetpack::$jetpack_redirect_login ] = 'true';
		do_action( 'login_init' ); // Now expect an exception.
	}

	/**
	 * Tests getting the correct Calypso host.
	 *
	 * @since 8.4.0
	 * @return void
	 */
	public function test_get_calypso_host() {
		// No env.
		$this->assertEquals( 'https://wordpress.com/', Jetpack::get_calypso_host() );

		$_GET['calypso_env'] = 'development';
		$this->assertEquals( 'http://calypso.localhost:3000/', Jetpack::get_calypso_host() );

		$_GET['calypso_env'] = 'wpcalypso';
		$this->assertEquals( 'https://wpcalypso.wordpress.com/', Jetpack::get_calypso_host() );

		$_GET['calypso_env'] = 'horizon';
		$this->assertEquals( 'https://horizon.wordpress.com/', Jetpack::get_calypso_host() );

		$_GET['calypso_env'] = 'stage';
		$this->assertEquals( 'https://wordpress.com/', Jetpack::get_calypso_host() );

		$_GET['calypso_env'] = 'production';
		$this->assertEquals( 'https://wordpress.com/', Jetpack::get_calypso_host() );
	}

	/**
	 * Tests the Jetpack::should_set_cookie() method.
	 *
	 * @param string  $key The state key test value.
	 * @param string  $set_screen The $current_screen->base test value.
	 * @param boolean $expected_output The expected output of Jetpack::should_set_cookie().
	 *
	 * @covers Jetpack::should_set_cookie
	 * @dataProvider should_set_cookie_provider
	 */
	public function test_should_set_cookie( $key, $set_screen, $expected_output ) {
		global $current_screen;
		$old_current_screen   = $current_screen;
		$current_screen       = new stdClass();
		$current_screen->base = $set_screen;

		$this->assertEquals( $expected_output, Jetpack::should_set_cookie( $key ) );
		$current_screen = $old_current_screen;
	}

	/**
	 * The data provider for test_should_set_cookie(). Provides an array of
	 * test data. Each data set is an array with the structure:
	 *     [0] => The state key test value.
	 *     [1] => The $current_screen->base test value.
	 *     [2] => The expected output of Jetpack::should_set_cookie().
	 */
	public function should_set_cookie_provider() {
		return array(
			array( 'display_update_modal', 'toplevel_page_jetpack', false ),
			array( 'display_update_modal', 'test_page', true ),
			array( 'display_update_modal', null, true ),
			array( 'message', 'toplevel_page_jetpack', true ),
			array( 'message', 'test_page', true ),
			array( 'message', null, true ),
		);
	}

	/**
	 * Testing that a deprecated action triggers Jetpack functionality.
	 *
	 * Using the `jetpack_updated_theme` action for the sake of testing.
	 *
	 * @expectedDeprecated jetpack_updated_theme
	 */
	public function test_deprecated_action_fires() {
		add_action( 'jetpack_updated_theme', '__return_false' );
		Jetpack::init()->deprecated_hooks();
		remove_action( 'jetpack_updated_theme', '__return_false' );
	}

	/**
	 * Testing that a deprecated filter triggers Jetpack functionality.
	 *
	 * Using the `jetpack_bail_on_shortcode` filter for the sake of testing.
	 *
	 * @expectedDeprecated jetpack_bail_on_shortcode
	 */
	public function test_deprecated_filter_fires() {
		add_filter( 'jetpack_bail_on_shortcode', '__return_false' );
		Jetpack::init()->deprecated_hooks();
		remove_filter( 'jetpack_bail_on_shortcode', '__return_false' );
	}
} // end class
