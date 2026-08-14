<?php
/**
 * Unit tests for the Jetpack_Connector class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for the Jetpack connector card handler.
 *
 * @covers \Automattic\Jetpack\Connection\Jetpack_Connector
 */
#[CoversClass( Jetpack_Connector::class )]
class Jetpack_Connector_Test extends TestCase {

	/**
	 * Admin user ID created for the test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the static $initialized flag so init() can be called in each test.
		$ref  = new \ReflectionClass( Jetpack_Connector::class );
		$prop = $ref->getProperty( 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, false );

		$this->admin_id = wp_insert_user(
			array(
				'user_login'   => 'connector_admin',
				'user_pass'    => 'password',
				'user_email'   => 'admin@example.org',
				'display_name' => 'Local Admin',
				'role'         => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_id );
	}

	/**
	 * Tear down after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		// Remove hooks that init() may have registered.
		remove_all_actions( 'wp_connectors_init' );
		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_actions( 'jetpack_client_authorize_error' );

		// Clean up any auth error transients left by tests.
		delete_transient( 'jetpack_connector_auth_error_' . $this->admin_id );

		$reflection_class = new \ReflectionClass( '\Automattic\Jetpack\Connection\Plugin_Storage' );
		try {
			$reflection_class->setStaticPropertyValue( 'configured', false );
			$reflection_class->setStaticPropertyValue( 'plugins', array() );
			$reflection_class->setStaticPropertyValue( 'current_blog_id', null );
		} catch ( \ReflectionException $e ) { // PHP 7 compat
			foreach ( array(
				'configured'      => false,
				'plugins'         => array(),
				'current_blog_id' => null,
			) as $prop => $default ) {
				$p = $reflection_class->getProperty( $prop );
				if ( PHP_VERSION_ID < 80100 ) {
					$p->setAccessible( true );
				}
				$p->setValue( null, $default );
			}
		}
		remove_action( 'update_option_active_plugins', array( Plugin_Storage::class, 'set_flag_to_refresh_active_connected_plugins' ) );

		// Reset Manager's memoized connection status.
		( new Manager() )->reset_connection_status();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );

		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_is_in_safe_mode' );
		StatusCache::clear();
	}

	/* ── init() ────────────────────────────────────────────────── */

	/**
	 * Test that init() registers the expected hooks.
	 */
	public function test_init_registers_hooks() {
		Jetpack_Connector::init();

		$this->assertIsInt( has_action( 'wp_connectors_init', array( Jetpack_Connector::class, 'register_connector' ) ) );
		$this->assertIsInt( has_action( 'admin_enqueue_scripts', array( Jetpack_Connector::class, 'enqueue_script_module' ) ) );
		$this->assertIsInt( has_action( 'jetpack_client_authorize_error', array( Jetpack_Connector::class, 'store_auth_error' ) ) );
	}

	/**
	 * Test that init() only runs once.
	 */
	public function test_init_runs_only_once() {
		Jetpack_Connector::init();
		// Remove hooks to detect if init registers them again.
		remove_all_actions( 'wp_connectors_init' );
		remove_all_actions( 'admin_enqueue_scripts' );

		Jetpack_Connector::init();

		$this->assertFalse( has_action( 'wp_connectors_init', array( Jetpack_Connector::class, 'register_connector' ) ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Jetpack_Connector::class, 'enqueue_script_module' ) ) );
	}

	/* ── register_connector() ──────────────────────────────────── */

	/**
	 * Test that register_connector() calls register() on the registry with the correct slug and fields.
	 */
	public function test_register_connector_calls_registry() {
		$registry = new class() {
			/** @var array Captured arguments from the register() call. */
			public $captured = array();

			/**
			 * Stub register method.
			 *
			 * @param string $slug Connector slug.
			 * @param array  $args Connector arguments.
			 */
			public function register( $slug, $args ) {
				$this->captured = array( $slug, $args );
			}
		};

		Jetpack_Connector::register_connector( $registry ); // @phan-suppress-current-line PhanTypeMismatchArgument -- anonymous stub satisfies the runtime interface.

		$this->assertSame( 'wordpress_com', $registry->captured[0] );
		$this->assertIsArray( $registry->captured[1] );
		$this->assertSame( 'cloud_service', $registry->captured[1]['type'] );
		$this->assertStringContainsString( 'jetpack-connect.svg', $registry->captured[1]['logo_url'] );
		$this->assertArrayHasKey( 'name', $registry->captured[1] );
		$this->assertArrayHasKey( 'description', $registry->captured[1] );
	}

	/* ── get_connector_data() — disconnected ───────────────────── */

	/**
	 * Test that get_connector_data() returns base fields when site is not registered.
	 */
	public function test_get_connector_data_when_disconnected() {
		// Site is not registered (no blog token).
		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertFalse( $data['isConnected'] );
		$this->assertFalse( $data['isRegistered'] );
		$this->assertNotEmpty( $data['apiRoot'] );
		$this->assertNotEmpty( $data['apiNonce'] );
		$this->assertNotEmpty( $data['redirectUri'] );
		$this->assertArrayHasKey( 'connectedPlugins', $data );
		$this->assertIsArray( $data['connectedPlugins'] );
		$this->assertArrayNotHasKey( 'siteDetails', $data );
		$this->assertArrayNotHasKey( 'currentUser', $data );
		$this->assertArrayNotHasKey( 'connectionOwner', $data );
		$this->assertArrayNotHasKey( 'ssoStatus', $data );
	}

	/* ── get_connector_data() — offline mode ───────────────────── */

	/**
	 * Test that isOfflineMode is false when the site is not in offline mode.
	 */
	public function test_get_connector_data_offline_mode_false_by_default() {
		StatusCache::clear();

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayHasKey( 'isOfflineMode', $data );
		$this->assertFalse( $data['isOfflineMode'] );
	}

	/**
	 * Test that isOfflineMode is true when the site is in offline mode.
	 */
	public function test_get_connector_data_offline_mode_true_when_offline() {
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertTrue( $data['isOfflineMode'] );
	}

	/**
	 * Test that pre-existing data array keys are preserved.
	 */
	public function test_get_connector_data_preserves_existing_keys() {
		$data = Jetpack_Connector::get_connector_data( array( 'customKey' => 'customValue' ) );

		$this->assertSame( 'customValue', $data['customKey'] );
		$this->assertArrayHasKey( 'isConnected', $data );
	}

	/* ── get_connector_data() — SSO status ──────── */

	/**
	 * Test that ssoStatus is absent when SSO module is not available (no Jetpack).
	 */
	public function test_sso_status_absent_when_module_unavailable() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayNotHasKey( 'ssoStatus', $data );
	}

	/**
	 * Test that ssoStatus is false when SSO module is available but not active.
	 */
	public function test_sso_status_false_when_inactive() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		\Jetpack_Options::update_option( 'active_modules', array() );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertFalse( $data['ssoStatus'] );
	}

	/**
	 * Test that ssoStatus is true when SSO module is active.
	 */
	public function test_sso_status_true_when_active() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		\Jetpack_Options::update_option( 'active_modules', array( 'sso' ) );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertTrue( $data['ssoStatus'] );
	}

	/* ── get_connector_data() — identity crisis (Safe Mode) ─────── */

	/**
	 * Test that isInSafeMode is false and no idc data is exposed when the site is not in Safe Mode.
	 */
	public function test_idc_data_absent_when_not_in_safe_mode() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		StatusCache::clear();

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayHasKey( 'isInSafeMode', $data );
		$this->assertFalse( $data['isInSafeMode'] );
		$this->assertArrayNotHasKey( 'idc', $data );
	}

	/**
	 * Test that Safe Mode data is exposed when the site is in Safe Mode.
	 */
	public function test_idc_data_present_when_in_safe_mode() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		StatusCache::clear();
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertTrue( $data['isInSafeMode'] );
		$this->assertArrayHasKey( 'isSafeModeConfirmed', $data );
		$this->assertArrayHasKey( 'idc', $data );
		$this->assertArrayHasKey( 'currentUrl', $data['idc'] );
		$this->assertArrayHasKey( 'wpcomHomeUrl', $data['idc'] );
		$this->assertArrayHasKey( 'isDevelopmentSite', $data['idc'] );
		$this->assertArrayHasKey( 'possibleDynamicSiteUrlDetected', $data['idc'] );
		$this->assertNotEmpty( $data['idc']['currentUrl'] );
	}

	/**
	 * Test that Safe Mode data is not exposed for an unregistered site.
	 */
	public function test_idc_data_absent_when_unregistered() {
		StatusCache::clear();
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayNotHasKey( 'isInSafeMode', $data );
		$this->assertArrayNotHasKey( 'idc', $data );
	}

	/* ── is_connectors_screen() ────────────────────────────────── */

	/**
	 * Test is_connectors_screen() recognises the WP 7.0 core screen ID.
	 */
	public function test_is_connectors_screen_core() {
		$this->assertTrue( $this->call_is_connectors_screen( 'options-connectors' ) );
	}

	/**
	 * Test is_connectors_screen() recognises the Gutenberg plugin screen ID.
	 */
	public function test_is_connectors_screen_gutenberg() {
		$this->assertTrue( $this->call_is_connectors_screen( 'settings_page_options-connectors-wp-admin' ) );
	}

	/**
	 * Test is_connectors_screen() rejects unrelated screen IDs.
	 */
	public function test_is_connectors_screen_rejects_other() {
		$this->assertFalse( $this->call_is_connectors_screen( 'dashboard' ) );
		$this->assertFalse( $this->call_is_connectors_screen( 'options-general' ) );
	}

	/* ── get_plugin_logo_url() ─────────────────────────────────── */

	/**
	 * Test that Jetpack-prefixed slugs get the Jetpack logo.
	 */
	public function test_logo_url_jetpack() {
		$url = $this->call_get_plugin_logo_url( 'jetpack' );
		$this->assertStringContainsString( 'jetpack-icon.svg', $url );
	}

	/**
	 * Test that a jetpack-* variant slug gets the Jetpack logo.
	 */
	public function test_logo_url_jetpack_boost() {
		$url = $this->call_get_plugin_logo_url( 'jetpack-boost' );
		$this->assertStringContainsString( 'jetpack-icon.svg', $url );
	}

	/**
	 * Test that WooCommerce-prefixed slugs get the Woo logo.
	 */
	public function test_logo_url_woocommerce() {
		$url = $this->call_get_plugin_logo_url( 'woocommerce' );
		$this->assertStringContainsString( 'woo-icon.svg', $url );
	}

	/**
	 * Test that woocommerce-prefixed slugs get the Woo logo.
	 */
	public function test_logo_url_woo_prefix() {
		$url = $this->call_get_plugin_logo_url( 'woocommerce-subscriptions' );
		$this->assertStringContainsString( 'woo-icon.svg', $url );
	}

	/**
	 * Test that Automattic-prefixed slugs get the Automattic logo.
	 */
	public function test_logo_url_automattic() {
		$url = $this->call_get_plugin_logo_url( 'automattic-for-agencies-client' );
		$this->assertStringContainsString( 'automattic-icon.svg', $url );
	}

	/**
	 * Test that unknown slugs return null.
	 */
	public function test_logo_url_unknown_returns_null() {
		$this->assertNull( $this->call_get_plugin_logo_url( 'some-other-plugin' ) );
	}

	/* ── get_connector_logo_url() ─────────────────────────────── */

	/**
	 * Test that the default connector logo is jetpack-connect.svg when no plugins are connected.
	 */
	public function test_connector_logo_default() {
		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect.svg', $url );
		$this->assertStringNotContainsString( 'jetpack-connect-woo', $url );
		$this->assertStringNotContainsString( 'jetpack-connect-a8c', $url );
		$this->assertStringNotContainsString( 'jetpack-connect-all', $url );
	}

	/**
	 * Test that the connector logo is jetpack-connect.svg when only Jetpack-family plugins are connected.
	 */
	public function test_connector_logo_jetpack_only() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		Plugin_Storage::upsert( 'jetpack-boost', array( 'name' => 'Jetpack Boost' ) );

		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect.svg', $url );
		$this->assertStringNotContainsString( 'jetpack-connect-woo', $url );
	}

	/**
	 * Test that the connector logo is jetpack-connect-woo.svg when a Woo-family plugin is connected.
	 */
	public function test_connector_logo_woo() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		Plugin_Storage::upsert( 'woocommerce', array( 'name' => 'WooCommerce' ) );

		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect-woo.svg', $url );
	}

	/**
	 * Test that woocommerce-prefixed slugs also trigger the Woo logo.
	 */
	public function test_connector_logo_woo_prefix() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'woocommerce-subscriptions', array( 'name' => 'WooCommerce Subscriptions' ) );

		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect-woo.svg', $url );
	}

	/**
	 * Test that the connector logo is jetpack-connect-a8c.svg when only A4A is connected.
	 */
	public function test_connector_logo_a4a() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		Plugin_Storage::upsert( 'automattic-for-agencies-client', array( 'name' => 'Automattic for Agencies' ) );

		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect-a8c.svg', $url );
	}

	/**
	 * Test that the connector logo is jetpack-connect-all.svg when both Woo and A4A are connected.
	 */
	public function test_connector_logo_woo_and_a4a() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		Plugin_Storage::upsert( 'woocommerce', array( 'name' => 'WooCommerce' ) );
		Plugin_Storage::upsert( 'automattic-for-agencies-client', array( 'name' => 'Automattic for Agencies' ) );

		$url = $this->call_get_connector_logo_url();
		$this->assertStringContainsString( 'jetpack-connect-all.svg', $url );
	}

	/* ── get_connected_plugin_families() ─────────────────────────── */

	/**
	 * Test that no families are detected when no plugins are connected.
	 */
	public function test_plugin_families_default() {
		$families = Jetpack_Connector::get_connected_plugin_families();
		$this->assertFalse( $families['has_woo'] );
		$this->assertFalse( $families['has_a4a'] );
	}

	/**
	 * Test that only Jetpack-family plugins don't trigger woo or a4a flags.
	 */
	public function test_plugin_families_jetpack_only() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );

		$families = Jetpack_Connector::get_connected_plugin_families();
		$this->assertFalse( $families['has_woo'] );
		$this->assertFalse( $families['has_a4a'] );
	}

	/**
	 * Test that woocommerce-prefixed slugs set has_woo.
	 */
	public function test_plugin_families_woo() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'woocommerce', array( 'name' => 'WooCommerce' ) );

		$families = Jetpack_Connector::get_connected_plugin_families();
		$this->assertTrue( $families['has_woo'] );
		$this->assertFalse( $families['has_a4a'] );
	}

	/**
	 * Test that automattic-prefixed slugs set has_a4a.
	 */
	public function test_plugin_families_a4a() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'automattic-for-agencies-client', array( 'name' => 'Automattic for Agencies' ) );

		$families = Jetpack_Connector::get_connected_plugin_families();
		$this->assertFalse( $families['has_woo'] );
		$this->assertTrue( $families['has_a4a'] );
	}

	/**
	 * Test that both flags are set when both families are present.
	 */
	public function test_plugin_families_woo_and_a4a() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'woocommerce', array( 'name' => 'WooCommerce' ) );
		Plugin_Storage::upsert( 'automattic-for-agencies-client', array( 'name' => 'Automattic for Agencies' ) );

		$families = Jetpack_Connector::get_connected_plugin_families();
		$this->assertTrue( $families['has_woo'] );
		$this->assertTrue( $families['has_a4a'] );
	}

	/* ── resolve_user_fields() ─────────────────────────────────── */

	/**
	 * Test that WPCOM data overrides local WP user fields.
	 */
	public function test_resolve_user_fields_wpcom_overrides() {
		$wp_user = get_userdata( $this->admin_id );

		$wpcom_data = array(
			'display_name' => 'WPCOM Name',
			'login'        => 'wpcom_login',
			'email'        => 'wpcom@example.com',
		);

		$result = $this->call_resolve_user_fields( $wp_user, $wpcom_data );

		$this->assertSame( 'WPCOM Name', $result['displayName'] );
		$this->assertSame( 'wpcom_login', $result['login'] );
		$this->assertSame( 'wpcom@example.com', $result['email'] );
		$this->assertNotEmpty( $result['avatar'] );
	}

	/**
	 * Test that local WP user fields are used when WPCOM data is false.
	 */
	public function test_resolve_user_fields_falls_back_to_local() {
		$wp_user = get_userdata( $this->admin_id );
		$result  = $this->call_resolve_user_fields( $wp_user, false );

		$this->assertSame( 'Local Admin', $result['displayName'] );
		$this->assertSame( 'connector_admin', $result['login'] );
		$this->assertSame( 'admin@example.org', $result['email'] );
	}

	/**
	 * Test that a false WP_User produces empty strings.
	 */
	public function test_resolve_user_fields_false_user() {
		$result = $this->call_resolve_user_fields( false, false );

		$this->assertSame( '', $result['displayName'] );
		$this->assertSame( '', $result['login'] );
		$this->assertSame( '', $result['email'] );
		$this->assertSame( '', $result['avatar'] );
	}

	/**
	 * Test that empty WPCOM fields do not override local values.
	 */
	public function test_resolve_user_fields_empty_wpcom_keeps_local() {
		$wp_user = get_userdata( $this->admin_id );

		$wpcom_data = array(
			'display_name' => '',
			'login'        => '',
			'email'        => '',
		);

		$result = $this->call_resolve_user_fields( $wp_user, $wpcom_data );

		$this->assertSame( 'Local Admin', $result['displayName'] );
		$this->assertSame( 'connector_admin', $result['login'] );
		$this->assertSame( 'admin@example.org', $result['email'] );
	}

	/* ── get_connection_owner_data() (via get_connector_data) ──── */

	/**
	 * Test that connection owner data includes localLogin.
	 */
	public function test_connection_owner_data_includes_local_login() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connection_owner_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$owner = get_userdata( $this->admin_id );

		$manager = $this->createStub( Manager::class );
		$manager->method( 'get_connection_owner' )->willReturn( $owner );
		$manager->method( 'get_connected_user_data' )->willReturn( false );

		$result = $method->invoke( null, $manager );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'localLogin', $result );
		$this->assertSame( 'connector_admin', $result['localLogin'] );
		$this->assertArrayHasKey( 'displayName', $result );
		$this->assertArrayHasKey( 'avatar', $result );
	}

	/**
	 * Test that get_connection_owner_data returns null when there is no owner.
	 */
	public function test_connection_owner_data_returns_null_when_no_owner() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connection_owner_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$manager = $this->createStub( Manager::class );
		$manager->method( 'get_connection_owner' )->willReturn( false );

		$this->assertNull( $method->invoke( null, $manager ) );
	}

	/* ── get_connected_plugins_data() ──────────────────────────── */

	/**
	 * Test that plugin data is assembled correctly with logo URLs.
	 */
	public function test_connected_plugins_data_with_logos() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connected_plugins_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$manager = $this->createStub( Manager::class );
		$manager->method( 'get_connected_plugins' )->willReturn(
			array(
				'jetpack'                        => array( 'name' => 'Jetpack' ),
				'woocommerce'                    => array( 'name' => 'WooCommerce' ),
				'automattic-for-agencies-client' => array( 'name' => 'Automattic for Agencies' ),
				'custom-plugin'                  => array( 'name' => 'Custom Plugin' ),
			)
		);

		$result = $method->invoke( null, $manager );

		$this->assertCount( 4, $result );

		// Jetpack plugin.
		$this->assertSame( 'Jetpack', $result[0]['name'] );
		$this->assertSame( 'jetpack', $result[0]['slug'] );
		$this->assertStringContainsString( 'jetpack-icon.svg', $result[0]['logoUrl'] );

		// WooCommerce plugin.
		$this->assertSame( 'WooCommerce', $result[1]['name'] );
		$this->assertStringContainsString( 'woo-icon.svg', $result[1]['logoUrl'] );

		// Automattic plugin.
		$this->assertSame( 'Automattic for Agencies', $result[2]['name'] );
		$this->assertStringContainsString( 'automattic-icon.svg', $result[2]['logoUrl'] );

		// Unknown plugin — no logoUrl key.
		$this->assertSame( 'Custom Plugin', $result[3]['name'] );
		$this->assertArrayNotHasKey( 'logoUrl', $result[3] );
	}

	/**
	 * Test that a WP_Error from get_connected_plugins returns an empty array.
	 */
	public function test_connected_plugins_data_handles_wp_error() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connected_plugins_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$manager = $this->createStub( Manager::class );
		$manager->method( 'get_connected_plugins' )->willReturn( new \WP_Error( 'fail', 'error' ) );

		$this->assertSame( array(), $method->invoke( null, $manager ) );
	}

	/**
	 * Test that a missing name key falls back to the slug.
	 */
	public function test_connected_plugins_data_falls_back_to_slug() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connected_plugins_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$manager = $this->createStub( Manager::class );
		$manager->method( 'get_connected_plugins' )->willReturn(
			array(
				'some-plugin' => array(),
			)
		);

		$result = $method->invoke( null, $manager );
		$this->assertSame( 'some-plugin', $result[0]['name'] );
	}

	/* ── get_connectors_page_path() ────────────────────────────── */

	/**
	 * Test that WP 7.0 core script name returns options-connectors.php.
	 */
	public function test_connectors_page_path_core() {
		$_SERVER['SCRIPT_NAME'] = '/wp-admin/options-connectors.php';

		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connectors_page_path' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( 'options-connectors.php', $method->invoke( null ) );

		unset( $_SERVER['SCRIPT_NAME'] );
	}

	/**
	 * Test that the Gutenberg plugin screen returns the correct page slug, not the screen ID.
	 *
	 * WordPress auto-prefixes submenu screen IDs (e.g. settings_page_<slug>), so using
	 * $screen->id directly as the page= parameter would produce an invalid URL.
	 */
	public function test_connectors_page_path_gutenberg() {
		$_SERVER['SCRIPT_NAME'] = '/wp-admin/options-general.php';

		$screen                    = new \stdClass();
		$screen->id                = Jetpack_Connector::GUTENBERG_CONNECTORS_SCREEN_ID;
		$GLOBALS['current_screen'] = $screen;

		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_connectors_page_path' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null );

		unset( $GLOBALS['current_screen'], $_SERVER['SCRIPT_NAME'] );

		$this->assertSame( 'options-general.php?page=' . Jetpack_Connector::GUTENBERG_CONNECTORS_PAGE_SLUG, $result );
	}

	/* ── store_auth_error() / consume_auth_error() ───────────── */

	/**
	 * Test that store_auth_error stores a transient for a WP_Error.
	 */
	public function test_store_auth_error_saves_transient() {
		$error = new \WP_Error( 'auth_denied', 'Authorization was denied.' );

		Jetpack_Connector::store_auth_error( $error );

		$stored = get_transient( 'jetpack_connector_auth_error_' . $this->admin_id );
		$this->assertSame( 'Authorization was denied.', $stored );
	}

	/**
	 * Test that store_auth_error ignores non-WP_Error values.
	 */
	public function test_store_auth_error_ignores_non_wp_error() {
		Jetpack_Connector::store_auth_error( 'not an error' ); // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- intentionally passing wrong type to test the guard.

		$this->assertFalse( get_transient( 'jetpack_connector_auth_error_' . $this->admin_id ) );
	}

	/**
	 * Test that store_auth_error does nothing when no user is logged in.
	 */
	public function test_store_auth_error_no_user() {
		wp_set_current_user( 0 );

		Jetpack_Connector::store_auth_error( new \WP_Error( 'fail', 'Failure.' ) );

		$this->assertFalse( get_transient( 'jetpack_connector_auth_error_0' ) );
	}

	/**
	 * Test that consume_auth_error reads and deletes the transient.
	 */
	public function test_consume_auth_error_reads_and_deletes() {
		set_transient( 'jetpack_connector_auth_error_' . $this->admin_id, 'Token expired.', 60 );

		$method = new \ReflectionMethod( Jetpack_Connector::class, 'consume_auth_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null );
		$this->assertSame( 'Token expired.', $result );

		// Transient should be deleted after consumption.
		$this->assertFalse( get_transient( 'jetpack_connector_auth_error_' . $this->admin_id ) );
	}

	/**
	 * Test that consume_auth_error deletes the transient even when value is an empty string.
	 */
	public function test_consume_auth_error_deletes_empty_string_transient() {
		set_transient( 'jetpack_connector_auth_error_' . $this->admin_id, '', 60 );

		$method = new \ReflectionMethod( Jetpack_Connector::class, 'consume_auth_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null );
		$this->assertSame( '', $result );

		// Transient must be deleted even though the value was falsy.
		$this->assertFalse( get_transient( 'jetpack_connector_auth_error_' . $this->admin_id ) );
	}

	/**
	 * Test that consume_auth_error returns false when no transient exists.
	 */
	public function test_consume_auth_error_returns_false_when_empty() {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'consume_auth_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertFalse( $method->invoke( null ) );
	}

	/**
	 * Test that consume_auth_error returns false for logged-out users.
	 */
	public function test_consume_auth_error_returns_false_no_user() {
		wp_set_current_user( 0 );

		$method = new \ReflectionMethod( Jetpack_Connector::class, 'consume_auth_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertFalse( $method->invoke( null ) );
	}

	/**
	 * Test that get_connector_data includes authError when transient is set.
	 */
	public function test_get_connector_data_includes_auth_error() {
		set_transient( 'jetpack_connector_auth_error_' . $this->admin_id, 'Auth failed.', 60 );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayHasKey( 'authError', $data );
		$this->assertSame( 'Auth failed.', $data['authError'] );

		// Transient should be consumed (deleted).
		$this->assertFalse( get_transient( 'jetpack_connector_auth_error_' . $this->admin_id ) );
	}

	/**
	 * Test that get_connector_data omits authError when no transient exists.
	 */
	public function test_get_connector_data_omits_auth_error_when_none() {
		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayNotHasKey( 'authError', $data );
	}

	/* ── Helpers ───────────────────────────────────────────────── */

	/**
	 * Call the private is_connectors_screen() method via reflection.
	 *
	 * @param string $screen_id Screen ID to test.
	 * @return bool
	 */
	private function call_is_connectors_screen( $screen_id ) {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'is_connectors_screen' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$screen     = new \stdClass();
		$screen->id = $screen_id;

		return $method->invoke( null, $screen );
	}

	/**
	 * Call the private get_plugin_logo_url() method via reflection.
	 *
	 * @param string $slug Plugin slug.
	 * @return string|null
	 */
	private function call_get_plugin_logo_url( $slug ) {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'get_plugin_logo_url' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, $slug );
	}

	/**
	 * Call get_connector_logo_url().
	 *
	 * @return string Logo URL.
	 */
	private function call_get_connector_logo_url() {
		return Jetpack_Connector::get_connector_logo_url();
	}

	/**
	 * Call the private resolve_user_fields() method via reflection.
	 *
	 * @param \WP_User|false $wp_user        WordPress user object or false.
	 * @param array|false    $wpcom_user_data WPCOM user data array or false.
	 * @return array
	 */
	private function call_resolve_user_fields( $wp_user, $wpcom_user_data ) {
		$method = new \ReflectionMethod( Jetpack_Connector::class, 'resolve_user_fields' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, $wp_user, $wpcom_user_data );
	}
}
