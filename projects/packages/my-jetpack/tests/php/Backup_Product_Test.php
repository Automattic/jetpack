<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Anti_Spam;
use Automattic\Jetpack\My_Jetpack\Products\Backup;
use Automattic\Jetpack\Redirect;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Backup_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		// Modules::get_active() only keeps available modules, and which filter lists them depends on the Jetpack plugin.
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_backup_module' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_standalone_backup_module' ) );
		Jetpack_Options::update_option( 'active_modules', array( 'backup' ) );
	}

	/**
	 * Available modules as the Jetpack plugin reports them: slug => version.
	 *
	 * @param array $modules Available modules.
	 * @return array
	 */
	public function add_backup_module( $modules ) {
		$modules['backup'] = '0.0.0';

		return $modules;
	}

	/**
	 * Available modules as a standalone plugin reports them: a list of slugs.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function add_standalone_backup_module( $modules ) {
		$modules[] = 'backup';

		return array_values( array_unique( $modules ) );
	}

	/**
	 * On the Jetpack plugin, Manage opens the wp-admin dashboard only once the stored plan registers it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_manage_urls
	 *
	 * @param array $stored    The stored plan's active features.
	 * @param array $wpcom     The active features WordPress.com reports.
	 * @param array $refreshed The active features a refresh of the stored plan brings.
	 * @param bool  $dashboard Whether a host leaves the bundled dashboard on.
	 * @param bool  $missed    Whether a refresh missed the plan moments ago.
	 * @param bool  $in_admin  Whether Manage should open wp-admin.
	 * @param bool  $holds_off Whether a refresh is held off afterwards.
	 * @param bool  $shared    Whether another request refreshed the plan moments ago.
	 * @param bool  $after     Whether another product reloaded the plan earlier in this request.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_manage_urls' )]
	public function test_manage_url_follows_the_plan( $stored, $wpcom, $refreshed, $dashboard, $missed, $in_admin, $holds_off, $shared = false, $after = false ) {
		( new Tokens() )->update_blog_token( 'key.secret' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		update_option( 'jetpack_active_plan', array( 'features' => array( 'active' => $stored ) ) );
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array(), HOUR_IN_SECONDS );
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => $wpcom,
				// Anti-Spam reaches the plan reload only when some bundle offers its feature.
				'available' => $after ? array( 'antispam' => array( 'jetpack_complete' ) ) : array(),
			),
			HOUR_IN_SECONDS
		);
		// Signing the refresh needs an absolute API base.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Constants::set_constant( 'JETPACK__API_VERSION', 1 );
		add_filter(
			'pre_http_request',
			static function () use ( $refreshed ) {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'plan' => array( 'features' => array( 'active' => $refreshed ) ) ), JSON_UNESCAPED_SLASHES ),
				);
			}
		);
		$dashboard || add_filter( 'jetpack_backup_dashboard_enabled', '__return_false' );
		$missed && set_transient( Backup::PLAN_REFRESH_MISS_TRANSIENT_KEY, true, MINUTE_IN_SECONDS );
		$shared && set_transient( Wpcom_Products::MY_JETPACK_PLAN_REFRESHED_TRANSIENT_KEY, 1, MINUTE_IN_SECONDS );
		$after && Anti_Spam::has_paid_plan_for_product();

		$this->assertSame( $in_admin, admin_url( 'admin.php?page=jetpack-backup' ) === Backup::get_manage_url() );
		$this->assertSame( $holds_off, (bool) get_transient( Backup::PLAN_REFRESH_MISS_TRANSIENT_KEY ) );
	}

	/**
	 * Data provider for test_manage_url_follows_the_plan.
	 *
	 * @return array
	 */
	public static function provide_manage_urls() {
		return array(
			'a stored Backup plan'                   => array( array( 'backups' ), array(), array(), true, false, true, false ),
			'a purchase the stored plan catches up'  => array( array(), array( 'backups' ), array( 'backups' ), true, false, true, false ),
			'a catch-up after a shared refresh'      => array( array(), array( 'backups' ), array( 'backups' ), true, false, true, false, true ),
			'a catch-up after Anti-Spam reloaded'    => array( array(), array( 'backups' ), array( 'backups' ), true, false, true, false, true, true ),
			'a purchase the stored plan lacks still' => array( array(), array( 'backups' ), array(), true, false, false, true ),
			'a recent miss holds off the refresh'    => array( array(), array( 'backups' ), array( 'backups' ), true, true, false, true ),
			'no plan'                                => array( array(), array(), array(), true, false, false, false ),
			'a host turned the dashboard off'        => array( array( 'backups' ), array(), array(), false, false, false, false ),
		);
	}

	/**
	 * The stored plan and products answer whether the site has, or had, Backup.
	 *
	 * @dataProvider provide_stored_plans
	 *
	 * @param array $plan     The stored plan.
	 * @param array $products The stored products.
	 * @param bool  $expected Whether a Backup plan is on record.
	 */
	#[DataProvider( 'provide_stored_plans' )]
	public function test_has_plan_on_record( $plan, $products, $expected ) {
		update_option( 'jetpack_active_plan', $plan );
		update_option( 'jetpack_site_products', $products );

		$this->assertSame( $expected, Backup::has_plan_on_record() );
	}

	/**
	 * A stored plan for an expired bundle, which lists only the other plans that include Backup.
	 *
	 * @param string $slug The bundle's product slug.
	 * @return array
	 */
	private static function expired_bundle( $slug ) {
		return array(
			'product_slug' => $slug,
			'expired'      => true,
			'features'     => array(
				'active'    => array(),
				'available' => array( 'backups' => array( 'jetpack_complete' ) ),
			),
		);
	}

	/**
	 * Data provider for test_has_plan_on_record.
	 *
	 * @return array
	 */
	public static function provide_stored_plans() {
		$free = array(
			'product_slug' => 'jetpack_free',
			'features'     => array( 'active' => array() ),
		);

		return array(
			'nothing'                     => array( $free, array(), false ),
			'a feature of a current plan' => array( array( 'features' => array( 'active' => array( 'backups' ) ) ), array(), true ),
			'an expired Backup product'   => array(
				$free,
				array(
					array(
						'product_slug' => 'jetpack_backup_t1_yearly',
						'expired'      => true,
					),
				),
				true,
			),
			'an expired Security bundle'  => array( self::expired_bundle( 'jetpack_security_t1_yearly' ), array(), true ),
			'an expired Starter bundle'   => array( self::expired_bundle( 'jetpack_starter_yearly' ), array(), true ),
			'an expired t0 Security plan' => array( self::expired_bundle( 'jetpack_security_t0_yearly' ), array(), true ),
			'an expired yearly Pro'       => array( self::expired_bundle( 'jetpack_pro_yearly' ), array(), true ),
			'an expired two-year Pro'     => array( self::expired_bundle( 'jetpack_pro_bi_yearly' ), array(), true ),
			'an expired legacy plan'      => array( self::expired_bundle( 'jetpack_business_monthly' ), array(), true ),
			'an expired Growth bundle'    => array( self::expired_bundle( 'jetpack_growth_yearly' ), array(), false ),
			'another product'             => array( $free, array( array( 'product_slug' => 'jetpack_scan' ) ), false ),
		);
	}

	/**
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Backup::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/backup-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack-backup/jetpack-backup.php' );
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'jetpack_get_available_modules', array( $this, 'add_backup_module' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_standalone_backup_module' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_undo_event_response' ) );
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests with Jetpack active
	 */
	public function test_if_jetpack_active_return_false() {
		activate_plugin( 'jetpack/jetpack.php' );
		$this->assertTrue( Backup::is_plugin_active() );
	}

	/**
	 * Tests with Backup active
	 */
	public function test_if_jetpack_inactive_and_backup_active_return_true() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertTrue( Backup::is_plugin_active() );
	}

	/**
	 * Tests with both inactive
	 */
	public function test_if_jetpack_inactive_and_backup_inactive_return_false() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertFalse( Backup::is_active() );
	}

	/**
	 * An older Jetpack plugin still opens its dashboard only with the module on, so the module decides.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_module_states
	 *
	 * @param bool $module_on Whether the backup module is on.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_module_states' )]
	public function test_an_older_jetpack_leaves_the_module_in_charge( $module_on ) {
		require_once __DIR__ . '/assets/older-jetpack-mock-plugin.txt';
		( new Tokens() )->update_blog_token( 'key.secret' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		// Not activate_plugins(), which would load the current Jetpack mock alongside this one.
		update_option( 'active_plugins', array( 'jetpack/jetpack.php' ) );
		Jetpack_Options::update_option( 'active_modules', $module_on ? array( 'backup' ) : array() );
		update_option( 'jetpack_active_plan', array( 'features' => array( 'active' => array( 'backups' ) ) ) );

		$this->assertFalse( Backup::is_plan_driven() );
		$this->assertSame( $module_on, Backup::is_module_active() );
		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-backup' ), Backup::get_manage_url() );
	}

	/**
	 * Data provider for test_an_older_jetpack_leaves_the_module_in_charge.
	 *
	 * @return array
	 */
	public static function provide_module_states() {
		return array(
			'module on'  => array( true ),
			'module off' => array( false ),
		);
	}

	/**
	 * Either plugin delivers Backup with the backup module off, since the plan decides it.
	 *
	 * @dataProvider provide_delivering_plugins
	 *
	 * @param bool $jetpack    Whether the Jetpack plugin is active.
	 * @param bool $standalone Whether the standalone plugin is active.
	 */
	#[DataProvider( 'provide_delivering_plugins' )]
	public function test_backup_module_off_does_not_switch_backup_off( $jetpack, $standalone ) {
		$jetpack ? activate_plugins( 'jetpack/jetpack.php' ) : deactivate_plugins( 'jetpack/jetpack.php' );
		$standalone ? activate_plugins( Backup::get_installed_plugin_filename() ) : deactivate_plugins( Backup::get_installed_plugin_filename() );
		Jetpack_Options::update_option( 'active_modules', array() );

		$this->assertTrue( Backup::is_module_active() );
		$this->assertTrue( Backup::is_activated() );
	}

	/**
	 * Data provider for test_backup_module_off_does_not_switch_backup_off.
	 *
	 * @return array
	 */
	public static function provide_delivering_plugins() {
		return array(
			'the Jetpack plugin'    => array( true, false ),
			'the standalone plugin' => array( false, true ),
		);
	}

	/**
	 * A plan holder who switched the module off still has Backup running.
	 */
	public function test_get_status_follows_the_plan_with_the_module_off() {
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		Jetpack_Options::update_option( 'active_modules', array() );
		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array(
				(object) array(
					'product_slug'  => 'jetpack_backup_t0_monthly',
					'expiry_status' => 'active',
					'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
				),
			),
			HOUR_IN_SECONDS
		);
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, 'no_errors', HOUR_IN_SECONDS );

		$this->assertSame( Products::STATUS_ACTIVE, Backup::get_status() );

		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}

	/**
	 * Tests Backup Manage URL with Backup plugin
	 */
	public function test_backup_manage_url_with_backup() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-backup' ), Backup::get_manage_url() );
	}

	/**
	 * Tests Backup Manage URL with Jetpack plugin
	 */
	public function test_backup_manage_url_with_jetpack() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-backup' ), Backup::get_manage_url() );
	}

	/**
	 * Manage and checkout land on the dashboard once the Jetpack plugin has initialized the package.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_backup_urls_target_the_dashboard_the_jetpack_plugin_hosts() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		do_action( 'jetpack_backup_initialized' );

		$this->assertSame( admin_url( 'admin.php?page=jetpack-backup' ), Backup::get_manage_url() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-backup' ), Backup::get_post_checkout_url() );
	}

	/**
	 * Tests Backup Post Activation URL with Jetpack disconected
	 */
	public function test_backup_post_activation_url_with_jetpack_disconnected() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( '', Backup::get_post_activation_url() );
	}

	/**
	 * Tests Backup Post Activation URL with Backup disconected
	 */
	public function test_backup_post_activation_url_with_backup_disconnected() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( '', Backup::get_post_activation_url() );
	}

	/**
	 * Tests Backup Post Activation URL with Jetpack conected
	 */
	public function test_backup_post_activation_url_with_jetpack_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( '', Backup::get_post_activation_url() );
	}

	/**
	 * Tests Backup Post Activation URL with Backup conected
	 */
	public function test_backup_post_activation_url_with_backup_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Backup::get_installed_plugin_filename() );
		$this->assertSame( '', Backup::get_post_activation_url() );
	}

	/**
	 * Tests get_status() returns INACTIVE when backups are deactivated
	 */
	public function test_get_status_returns_inactive_when_backups_deactivated() {
		activate_plugins( 'jetpack/jetpack.php' );

		// Mock having a Backup plan by setting the purchases transient.
		$mock_purchases = array(
			(object) array(
				'product_slug'  => 'jetpack_backup_t0_monthly',
				'expiry_status' => 'active',
				'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
			),
		);
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $mock_purchases, HOUR_IN_SECONDS );

		// Mock the backup status transient with backups-deactivated status.
		$deactivated_status = array(
			'type' => 'error',
			'data' => array(
				'source'       => 'rewind',
				'status'       => 'backups-deactivated',
				'last_updated' => time(),
			),
		);
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, $deactivated_status, HOUR_IN_SECONDS );

		$status = Backup::get_status();
		// User has a plan but backups are deactivated -> show INACTIVE.
		$this->assertSame( Products::STATUS_INACTIVE, $status );

		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}

	/**
	 * Tests get_status() does NOT override NEEDS_PLAN when backups are deactivated
	 */
	public function test_get_status_preserves_needs_plan_when_backups_deactivated() {
		// Default state: no mocking any purchases, so parent returns NEEDS_PLAN.
		activate_plugins( 'jetpack/jetpack.php' );

		// Mock the backup status transient with backups-deactivated status.
		$deactivated_status = array(
			'type' => 'error',
			'data' => array(
				'source'       => 'rewind',
				'status'       => 'backups-deactivated',
				'last_updated' => time(),
			),
		);
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, $deactivated_status, HOUR_IN_SECONDS );

		$status = Backup::get_status();
		// Should preserve NEEDS_PLAN, not override to INACTIVE.
		// User needs to purchase a plan before they can use backups.
		$this->assertSame( Products::STATUS_NEEDS_PLAN, $status );

		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );
	}

	/**
	 * Tests get_status() returns ACTIVE when no errors
	 */
	public function test_get_status_returns_active_when_no_errors() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );

		// Mock having a Backup plan.
		$mock_purchases = array(
			(object) array(
				'product_slug'  => 'jetpack_backup_t0_monthly',
				'expiry_status' => 'active',
				'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
			),
		);
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $mock_purchases, HOUR_IN_SECONDS );

		// Mock no backup errors (clean state).
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, 'no_errors', HOUR_IN_SECONDS );

		$status = Backup::get_status();
		$this->assertSame( Products::STATUS_ACTIVE, $status );

		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}

	/**
	 * Tests get_status() returns NEEDS_ATTENTION__ERROR for real backup errors
	 */
	public function test_get_status_returns_error_when_backup_fails() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );

		// Mock having a Backup plan.
		$mock_purchases = array(
			(object) array(
				'product_slug'  => 'jetpack_backup_t0_monthly',
				'expiry_status' => 'active',
				'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
			),
		);
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $mock_purchases, HOUR_IN_SECONDS );

		// Mock a real backup error (NOT backups-deactivated).
		$error_status = array(
			'type' => 'error',
			'data' => array(
				'source'       => 'last_backup',
				'status'       => 'error',
				'last_updated' => time(),
			),
		);
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, $error_status, HOUR_IN_SECONDS );

		$status = Backup::get_status();
		$this->assertSame( Products::STATUS_NEEDS_ATTENTION__ERROR, $status );

		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
	}

	/**
	 * Requests made to the rewindable activity endpoint.
	 *
	 * @var int
	 */
	private $undo_event_calls = 0;

	/**
	 * The HTTP status the mocked rewindable activity endpoint answers with.
	 *
	 * @var int
	 */
	private $undo_event_status = 200;

	/**
	 * Answers the rewindable activity endpoint with one undoable plugin update after a backup.
	 *
	 * @param false|array $pre  The short-circuit value.
	 * @param array       $args Request arguments.
	 * @param string      $url  Request URL.
	 * @return false|array
	 */
	public function mock_undo_event_response( $pre, $args, $url ) {
		if ( false === strpos( $url, '/activity/rewindable' ) ) {
			return $pre;
		}
		++$this->undo_event_calls;

		return array(
			'response' => array( 'code' => $this->undo_event_status ),
			'body'     => wp_json_encode(
				array(
					'current' => array(
						'orderedItems' => array(
							array(
								'is_rewindable' => true,
								'name'          => 'plugin__updated',
								'rewind_id'     => '2',
							),
							array(
								'is_rewindable' => true,
								'name'          => 'rewind__backup_complete_full',
								'rewind_id'     => '1',
							),
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * Connects the site and the current user, and mocks the rewindable activity endpoint.
	 */
	private function connect_and_mock_undo_event() {
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Constants::set_constant( 'JETPACK__API_VERSION', 1 );
		add_filter( 'pre_http_request', array( $this, 'mock_undo_event_response' ), 10, 3 );
	}

	/**
	 * The undo event the endpoint would send, or null when it finds none.
	 *
	 * @return array|null
	 */
	private function undo_event() {
		$response = Backup::get_site_backup_undo_event();
		return $response instanceof \WP_REST_Response ? $response->get_data() : $response;
	}

	/**
	 * A repeat visit by the same user reuses the undo event instead of asking WPCOM again.
	 */
	public function test_undo_event_is_reused_for_the_same_user() {
		$this->connect_and_mock_undo_event();

		$first  = $this->undo_event();
		$second = $this->undo_event();

		$this->assertSame( 1, $this->undo_event_calls );
		$this->assertSame( '1', $first['undo_backup_id'] ?? null );
		$this->assertSame( $first, $second );
	}

	/**
	 * WPCOM answers as the user, so another admin who isn't connected never gets the cached event.
	 */
	public function test_undo_event_is_not_shared_with_another_user() {
		$this->connect_and_mock_undo_event();
		$this->undo_event();

		$other_admin = wp_insert_user(
			array(
				'user_login' => 'unconnected_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $other_admin );
		$result = $this->undo_event();

		$this->assertNull( $result );
	}

	/**
	 * A failed lookup is not stored, so the next visit asks WPCOM again.
	 */
	public function test_failed_undo_event_lookup_is_retried() {
		$this->connect_and_mock_undo_event();
		$this->undo_event_status = 500;
		$failed                  = $this->undo_event();

		$this->undo_event_status = 200;
		$retried                 = $this->undo_event();

		$this->assertNull( $failed );
		$this->assertSame( 2, $this->undo_event_calls );
		$this->assertSame( '1', $retried['undo_backup_id'] ?? null );
	}
}
