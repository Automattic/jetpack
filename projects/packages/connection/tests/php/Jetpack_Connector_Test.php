<?php
/**
 * Unit tests for the Jetpack_Connector class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Cache as StatusCache;
use Automattic\Jetpack\Tracking;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Manager whose capability mapping is registered for protected-owner tests.
	 *
	 * @var Manager|null
	 */
	private $caps_manager = null;

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
		} catch ( \ReflectionException $e ) { // PHP <7.4.9 compat
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
		remove_all_filters( 'jetpack_connection_requires_protected_owner' );
		remove_all_filters( 'jetpack_connection_protected_owner_default_ui' );
		remove_all_filters( 'script_module_data_' . Jetpack_Connector::MODULE_ID );

		unset( $GLOBALS['current_screen'] );
		wp_deregister_script_module( Jetpack_Connector::MODULE_ID );
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;
		if ( null !== $this->caps_manager ) {
			remove_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1 );
			$this->caps_manager = null;
		}
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

		$this->assertNotEmpty( $data['apiRoot'] );
		$this->assertNotEmpty( $data['apiNonce'] );
		$this->assertNotEmpty( $data['redirectUri'] );
		$this->assertIsArray( $data['pluginLogos'] );
		$this->assertNull( $data['connectionOwnerEditUrl'] );
		$this->assertArrayNotHasKey( 'siteDetails', $data );
		$this->assertArrayNotHasKey( 'connectedUsersUrl', $data );
		$this->assertArrayNotHasKey( 'protectedOwner', $data );
		$this->assertArrayNotHasKey( 'ssoStatus', $data );
	}

	/**
	 * Connection state the jetpack-connection store provides is not sent a second time.
	 */
	public function test_get_connector_data_leaves_shared_state_to_the_store() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'master_user', $this->admin_id );
		\Jetpack_Options::update_option(
			'user_tokens',
			array( $this->admin_id => 'ownerkey.private.' . $this->admin_id )
		);

		$data = Jetpack_Connector::get_connector_data( array() );

		foreach ( array( 'isConnected', 'isRegistered', 'isOfflineMode', 'isFirstConnection', 'currentUser', 'connectionOwner', 'connectedPlugins' ) as $key ) {
			$this->assertArrayNotHasKey( $key, $data );
		}
		$this->assertSame( array( 'siteUrl', 'homeUrl' ), array_keys( $data['siteDetails'] ) );
	}

	/* ── get_connector_data() — connected ──────────────────────── */

	/**
	 * A connected site carries a link to the connected users list.
	 */
	public function test_get_connector_data_when_connected() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'master_user', $this->admin_id );
		\Jetpack_Options::update_option(
			'user_tokens',
			array( $this->admin_id => 'ownerkey.private.' . $this->admin_id )
		);
		wp_set_current_user( $this->admin_id );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertStringContainsString( 'users.php', $data['connectedUsersUrl'] );
		$this->assertStringContainsString(
			Users_Connection_Admin::VIEW_QUERY_ARG . '=' . Users_Connection_Admin::VIEW_CONNECTED,
			$data['connectedUsersUrl']
		);
	}

	/**
	 * A site connection with no user tokens and no owner links to no connected users.
	 */
	public function test_get_connector_data_when_site_only() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayHasKey( 'siteDetails', $data );
		$this->assertArrayNotHasKey( 'connectedUsersUrl', $data );
	}

	/**
	 * A broken owner token still links to the connected users, as the card still lists accounts.
	 */
	public function test_get_connector_data_when_the_owner_token_is_broken() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'master_user', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayHasKey( 'connectedUsersUrl', $data );
		$this->assertStringEndsWith( $data['redirectUri'], $data['connectorsUrl'] );
	}

	/**
	 * The owner's name links to their profile only for a viewer who may edit them.
	 *
	 * @param bool $map_caps      Whether the connection capabilities are mapped.
	 * @param bool $has_owner     Whether a connection owner is stored.
	 * @param bool $offline       Whether the site is in offline mode, which denies jetpack_connect but still shows the owner.
	 * @param bool $expected      Whether the card gets a profile URL.
	 * @dataProvider provide_connection_owner_edit_url
	 */
	#[DataProvider( 'provide_connection_owner_edit_url' )]
	public function test_connection_owner_edit_url( $map_caps, $has_owner, $offline, $expected ) {
		if ( $map_caps ) {
			$this->map_connection_caps();
		}
		if ( $has_owner ) {
			\Jetpack_Options::update_option( 'master_user', $this->admin_id );
		}
		if ( $offline ) {
			add_filter( 'jetpack_offline_mode', '__return_true' );
		}

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( $expected, null !== $data['connectionOwnerEditUrl'] );
	}

	/**
	 * Data provider for test_connection_owner_edit_url.
	 *
	 * @return array
	 */
	public static function provide_connection_owner_edit_url() {
		return array(
			'admin, owner stored' => array( true, true, false, true ),
			'no owner stored'     => array( true, false, false, false ),
			'no jetpack_connect'  => array( false, true, false, false ),
			'offline mode'        => array( true, true, true, true ),
		);
	}

	/**
	 * A consumer request exposes protected-owner card state before anyone has claimed it.
	 */
	public function test_protected_owner_card_state_when_a_consumer_requests_one() {
		$this->map_connection_caps();
		add_filter( 'jetpack_connection_requires_protected_owner', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( Manager::PO_STATE_NEEDS_CONNECT_TO_ESTABLISH, $data['protectedOwner']['status'] );
		$this->assertFalse( $data['protectedOwner']['viewerIsConfirmedOwner'] );
	}

	/**
	 * The card uses the package dialog whatever a consumer does with its own.
	 */
	public function test_protected_owner_card_state_ignores_the_default_ui_filter() {
		$this->map_connection_caps();
		add_filter( 'jetpack_connection_requires_protected_owner', '__return_true' );
		add_filter( 'jetpack_connection_protected_owner_default_ui', '__return_false' );
		\Jetpack_Options::update_option(
			'user_tokens',
			array( $this->admin_id => 'ownerkey.private.' . $this->admin_id )
		);

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( Manager::PO_STATE_CAN_ESTABLISH, $data['protectedOwner']['status'] );
		$this->assertArrayNotHasKey( 'useDefaultUi', $data['protectedOwner'] );
	}

	/**
	 * A stored anchor changes the card even when no consumer is requesting a protected owner.
	 */
	public function test_protected_owner_card_state_when_an_anchor_is_stored() {
		Protected_Owner::set( 4242, $this->admin_id );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( Manager::PO_STATE_NEEDS_OWNER_RECONNECT, $data['protectedOwner']['status'] );
		$this->assertFalse( $data['protectedOwner']['viewerIsConfirmedOwner'] );
	}

	/**
	 * The owner whose own token cannot be read is told they are the one to reconnect.
	 *
	 * `resolve_wpcom_user_id()` answers 0 without a live token while the binding survives, so
	 * this is the ordinary way into the reconnect state rather than an edge case.
	 */
	public function test_protected_owner_card_state_marks_the_viewer_as_the_confirmed_owner() {
		Protected_Owner::set( 4242, $this->admin_id );
		Utils::set_wpcom_user_id( $this->admin_id, 4242 );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( Manager::PO_STATE_NEEDS_OWNER_RECONNECT, $data['protectedOwner']['status'] );
		$this->assertTrue( $data['protectedOwner']['viewerIsConfirmedOwner'] );
	}

	/**
	 * Register the connection capability mapping configure() would have registered.
	 */
	private function map_connection_caps() {
		$this->caps_manager = new Manager();
		add_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Test that pre-existing data array keys are preserved.
	 */
	public function test_get_connector_data_preserves_existing_keys() {
		$data = Jetpack_Connector::get_connector_data( array( 'customKey' => 'customValue' ) );

		$this->assertSame( 'customValue', $data['customKey'] );
		$this->assertArrayHasKey( 'apiRoot', $data );
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
	 * Test that no idc data is exposed when the site is not in Safe Mode.
	 */
	public function test_idc_data_absent_when_not_in_safe_mode() {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		StatusCache::clear();

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayNotHasKey( 'isSafeModeConfirmed', $data );
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

		$this->assertArrayHasKey( 'isSafeModeConfirmed', $data );
		$this->assertArrayHasKey( 'idc', $data );
		$this->assertArrayHasKey( 'currentUrl', $data['idc'] );
		$this->assertArrayHasKey( 'wpcomHomeUrl', $data['idc'] );
		$this->assertArrayHasKey( 'isDevelopmentSite', $data['idc'] );
		$this->assertArrayHasKey( 'possibleDynamicSiteUrlDetected', $data['idc'] );
		$this->assertSame( 'self-hosted', $data['idc']['platform'] );
		$this->assertNotEmpty( $data['idc']['currentUrl'] );
	}

	/**
	 * Test that the card bumps Safe Mode MC stats only when tracking is allowed.
	 *
	 * @param bool $tos_agreed Whether the site agreed to the terms of service.
	 * @dataProvider provide_tos_states
	 */
	#[DataProvider( 'provide_tos_states' )]
	public function test_idc_bump_stats_follows_tracking_consent( $tos_agreed ) {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'tos_agreed', $tos_agreed );
		StatusCache::clear();
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertSame( $tos_agreed, $data['idc']['bumpStats'] );
	}

	/**
	 * Terms of service states for the Safe Mode MC stats.
	 *
	 * @return array[]
	 */
	public static function provide_tos_states() {
		return array(
			'agreed'     => array( true ),
			'not agreed' => array( false ),
		);
	}

	/**
	 * Test that Safe Mode data is not exposed for an unregistered site.
	 */
	public function test_idc_data_absent_when_unregistered() {
		StatusCache::clear();
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );

		$data = Jetpack_Connector::get_connector_data( array() );

		$this->assertArrayNotHasKey( 'isSafeModeConfirmed', $data );
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

	/* ── enqueue_script_module() ────────────────────────────────── */

	/**
	 * Test that the card is registered from the build, with the dependencies and version from its asset file.
	 */
	public function test_enqueue_registers_the_built_module_from_its_asset_file() {
		wp_register_script( 'test-card-global', 'https://example.com/global.js', array(), '1', true );
		$restore = $this->stub_module_build(
			array(
				'dependencies'        => array( 'test-card-global' ),
				'module_dependencies' => array(
					array(
						'id'     => '@wordpress/connectors',
						'import' => 'static',
					),
				),
				'version'             => 'test-card-version',
				'type'                => 'module',
			)
		);

		try {
			$this->enqueue_on_connectors_screen();
		} finally {
			$restore();
		}

		$module = wp_script_modules()->get_registered( Jetpack_Connector::MODULE_ID );
		$this->assertNotNull( $module );
		$this->assertStringEndsWith( 'dist/connectors/connectors-card.js', $module['src'] );
		$this->assertSame( 'test-card-version', $module['version'] );
		$this->assertSame( array( '@wordpress/connectors' ), array_column( $module['dependencies'], 'id' ) );
		$this->assertTrue( wp_script_is( 'test-card-global', 'enqueued' ) );
	}

	/**
	 * Test that core looks up the card's translations under the package domain and the file's real path.
	 */
	public function test_card_translations_are_looked_up_under_the_package_domain_and_real_path() {
		$restore       = $this->stub_module_build( array( 'version' => 'test-card-version' ) );
		$lookup_file   = '';
		$lookup_domain = '';
		$path          = '';

		$record_lookup = static function ( $file, $handle, $domain ) use ( &$lookup_file, &$lookup_domain ) {
			if ( Jetpack_Connector::MODULE_ID === $handle && '' === $lookup_file ) {
				$lookup_file   = basename( (string) $file );
				$lookup_domain = (string) $domain;
			}
			return $file;
		};
		$record_path   = static function ( $relative, $src ) use ( &$path ) {
			if ( str_contains( $src, 'connectors-card.js' ) && '' === $path ) {
				$path = (string) $relative;
			}
			return $relative;
		};
		add_filter( 'load_script_translation_file', $record_lookup, 10, 3 );
		add_filter( 'load_script_textdomain_relative_path', $record_path, 10, 2 );

		try {
			$this->enqueue_on_connectors_screen();
			ob_start();
			wp_script_modules()->print_script_module_translations();
			ob_end_clean();
		} finally {
			$restore();
			remove_filter( 'load_script_translation_file', $record_lookup );
			remove_filter( 'load_script_textdomain_relative_path', $record_path );
		}

		$this->assertSame( 'jetpack-connection', $lookup_domain );
		$this->assertStringStartsWith( 'jetpack-connection-', $lookup_file );
		$this->assertStringEndsWith( 'dist/connectors/connectors-card.js', $path );
		$this->assertStringNotContainsString( '..', $path );
	}

	/**
	 * Test that a missing build skips the card, instead of fataling on the asset file.
	 *
	 * @param array|null $asset   Asset data, or null for no asset file.
	 * @param bool       $with_js Whether the module's JS file exists.
	 * @dataProvider provide_incomplete_builds
	 */
	#[DataProvider( 'provide_incomplete_builds' )]
	public function test_enqueue_skips_the_card_when_the_build_is_missing( $asset, $with_js ) {
		$restore = $this->stub_module_build( $asset, $with_js );

		try {
			$this->enqueue_on_connectors_screen();
		} finally {
			$restore();
		}

		$this->assertNull( wp_script_modules()->get_registered( Jetpack_Connector::MODULE_ID ) );
		$this->assertFalse( wp_style_is( 'jetpack-connector-card', 'enqueued' ) );
	}

	/**
	 * Test that the Tracks script loads only when tracking is allowed, while the blog ID it adds to events always loads.
	 *
	 * @param bool $tos_agreed Whether the site agreed to the terms of service.
	 * @param bool $offline    Whether the site is in offline mode.
	 * @param bool $expected   Whether the Tracks script should be enqueued.
	 * @dataProvider provide_tracking_states
	 */
	#[DataProvider( 'provide_tracking_states' )]
	public function test_enqueue_loads_tracks_only_when_tracking_is_allowed( $tos_agreed, $offline, $expected ) {
		\Jetpack_Options::update_option( 'tos_agreed', $tos_agreed );
		\Jetpack_Options::update_option( 'id', 12345 );
		if ( $offline ) {
			add_filter( 'jetpack_offline_mode', '__return_true' );
		}

		$this->enqueue_with_connection_script();

		$this->assertSame( $expected, wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'jp-tracks-functions', 'enqueued' ) );
		$this->assertStringContainsString(
			'window.jpTracksContext.blog_id = 12345;',
			implode( '', (array) wp_scripts()->get_data( 'jetpack-connection', 'before' ) )
		);
	}

	/**
	 * Test that an identity crisis, which loads Tracks without consent, still gets the blog ID on its events.
	 */
	public function test_enqueue_sets_blog_id_when_identity_crisis_loads_tracks_without_consent() {
		\Jetpack_Options::update_option( 'tos_agreed', false );
		\Jetpack_Options::update_option( 'id', 12345 );

		// What Identity_Crisis\UI::init() does, with no consent check.
		Tracking::register_tracks_functions_scripts( true );
		$this->enqueue_with_connection_script();

		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertStringContainsString(
			'window.jpTracksContext.blog_id = 12345;',
			implode( '', (array) wp_scripts()->get_data( 'jetpack-connection', 'before' ) )
		);
	}

	/**
	 * Tracking states for the Tracks enqueue.
	 *
	 * @return array[]
	 */
	public static function provide_tracking_states() {
		return array(
			'agreed'          => array( true, false, true ),
			'not agreed'      => array( false, false, false ),
			'agreed, offline' => array( true, true, false ),
		);
	}

	/**
	 * Builds missing a file, as in a checkout that hasn't run the build or mid-deploy.
	 *
	 * @return array[]
	 */
	public static function provide_incomplete_builds() {
		return array(
			'no asset file' => array( null, true ),
			'no JS file'    => array( array( 'version' => 'test-card-version' ), false ),
		);
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

	/* ── get_plugin_logos() ─────────────────────────────────────── */

	/**
	 * Connected plugins get their logo by slug, and plugins without one are left out.
	 */
	public function test_get_connector_data_maps_plugin_logos_by_slug() {
		Plugin_Storage::configure();
		Plugin_Storage::upsert( 'jetpack', array( 'name' => 'Jetpack' ) );
		Plugin_Storage::upsert( 'woocommerce', array( 'name' => 'WooCommerce' ) );
		Plugin_Storage::upsert( 'custom-plugin', array( 'name' => 'Custom Plugin' ) );

		$logos = Jetpack_Connector::get_connector_data( array() )['pluginLogos'];

		$this->assertSame( array( 'jetpack', 'woocommerce' ), array_keys( $logos ) );
		$this->assertStringContainsString( 'jetpack-icon.svg', $logos['jetpack'] );
		$this->assertStringContainsString( 'woo-icon.svg', $logos['woocommerce'] );
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
	 *
	 * The screen has to be a real WP_Screen: WP 7.0 made get_current_screen() return null
	 * for anything else, so a stdClass stub silently takes the core-screen branch instead.
	 */
	public function test_connectors_page_path_gutenberg() {
		$_SERVER['SCRIPT_NAME'] = '/wp-admin/options-general.php';

		set_current_screen( Jetpack_Connector::GUTENBERG_CONNECTORS_SCREEN_ID );
		$this->assertSame( Jetpack_Connector::GUTENBERG_CONNECTORS_SCREEN_ID, get_current_screen()->id );

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
	 * Enqueue the card as WordPress does on the core Connectors screen.
	 */
	private function enqueue_on_connectors_screen() {
		set_current_screen( 'options-connectors' );
		Jetpack_Connector::enqueue_script_module();
	}

	/**
	 * Enqueue the card with a build that depends on the shared connection script, as the real one does.
	 */
	private function enqueue_with_connection_script() {
		$restore = $this->stub_module_build(
			array(
				'version'      => 'test-card-version',
				'dependencies' => array( 'jetpack-connection' ),
			)
		);

		try {
			wp_register_script( 'jetpack-connection', 'https://example.org/jetpack-connection.js', array(), 'test', true );
			$this->enqueue_on_connectors_screen();
		} finally {
			$restore();
		}
	}

	/**
	 * Put fixture build files where the card's build goes, or remove them, restoring any real build afterwards.
	 *
	 * @param array|null $asset   Asset data to write, or null for no asset file.
	 * @param bool       $with_js Whether to write a module JS file, or remove it.
	 * @return callable Restores the previous state.
	 */
	private function stub_module_build( $asset, $with_js = true ) {
		$class_dir = dirname( ( new \ReflectionClass( Jetpack_Connector::class ) )->getFileName() );
		$base      = $class_dir . '/' . Jetpack_Connector::MODULE_FILE;
		$dir       = dirname( $base );
		$files     = array(
			$base . '.asset.php' => null === $asset ? null : '<?php return ' . var_export( $asset, true ) . ';', // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			$base . '.js'        => $with_js ? '' : null,
		);

		$originals = array();
		foreach ( array_keys( $files ) as $file ) {
			$originals[ $file ] = file_exists( $file ) ? file_get_contents( $file ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		}

		$created_dirs = array();
		foreach ( array( dirname( $dir ), $dir ) as $d ) {
			if ( ! is_dir( $d ) ) {
				mkdir( $d );
				$created_dirs[] = $d;
			}
		}

		foreach ( $files as $file => $contents ) {
			if ( null !== $contents ) {
				file_put_contents( $file, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			} elseif ( file_exists( $file ) ) {
				unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			}
		}

		return static function () use ( $originals, $created_dirs ) {
			foreach ( $originals as $file => $original ) {
				if ( null !== $original ) {
					file_put_contents( $file, $original ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
				} elseif ( file_exists( $file ) ) {
					unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
				}
			}
			// Only directories this fixture created, and only while empty.
			foreach ( array_reverse( $created_dirs ) as $d ) {
				if ( 2 === count( scandir( $d ) ) ) {
					rmdir( $d ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
				}
			}
		};
	}

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
}
