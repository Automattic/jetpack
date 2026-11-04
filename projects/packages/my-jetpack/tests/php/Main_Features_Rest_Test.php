<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

class Main_Features_Rest_Test extends TestCase {

	const ROUTE = '/wpcom/v2/my-jetpack/site/features/plugin';

	const BULK_ROUTE = '/wpcom/v2/my-jetpack/site/features/bulk';

	/**
	 * A standalone plugin on disk, in the folder the feature map names.
	 */
	const PLUGIN_DIR = WP_PLUGIN_DIR . '/jetpack-boost';

	private $server;

	/**
	 * Plugin folders created by a test, removed in tearDown.
	 *
	 * @var string[]
	 */
	private $carriers = array();

	/**
	 * Whether this test installed the Jetpack plugin mock, and so must remove it.
	 *
	 * @var bool
	 */
	private $installed_jetpack = false;

	public function setUp(): void {
		parent::setUp();

		if ( ! file_exists( self::PLUGIN_DIR ) ) {
			mkdir( self::PLUGIN_DIR, 0777, true );
		}
		copy( __DIR__ . '/assets/boost-mock-plugin.txt', self::PLUGIN_DIR . '/jetpack-boost.php' );
		wp_cache_delete( 'plugins', 'plugins' );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'test_admin',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
	}

	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		remove_filter( 'user_has_cap', array( $this, 'deny_activate_plugins' ) );
		remove_filter( 'map_meta_cap', array( $this, 'map_module_caps' ) );
		$this->withdraw_stats_module();
		$this->remove_jetpack();
		$this->set_plan_cache( null );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		foreach ( $this->carriers as $root ) {
			$initializer = $root . '/jetpack_vendor/automattic/jetpack-my-jetpack/src/class-initializer.php';
			if ( is_dir( $initializer ) ) {
				rmdir( $initializer );
			} elseif ( file_exists( $initializer ) ) {
				unlink( $initializer );
			}
			if ( is_dir( dirname( $initializer ) ) ) {
				rmdir( dirname( $initializer ) );
			}
			foreach (
				array(
					$root . '/jetpack_vendor/automattic/jetpack-my-jetpack',
					$root . '/jetpack_vendor/automattic',
					$root . '/jetpack_vendor',
					$root,
				) as $dir
			) {
				if ( is_dir( $dir ) ) {
					rmdir( $dir );
				}
			}
		}

		$this->carriers = array();

		unlink( self::PLUGIN_DIR . '/jetpack-boost.php' );
		rmdir( self::PLUGIN_DIR );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Send one request to the route.
	 *
	 * @param string $plugin The plugin slug.
	 * @param string $action The action.
	 * @return \WP_REST_Response
	 */
	private function send( $plugin, $action ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_body_params( compact( 'plugin', 'action' ) );

		return $this->server->dispatch( $request );
	}

	/**
	 * The grid refreshes from this route, so a hidden feature must stay out of it too.
	 */
	public function test_the_features_route_leaves_out_what_a_host_hid() {
		$hide = function ( $states ) {
			$states['search'] = 'hidden';
			return $states;
		};
		add_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/wpcom/v2/my-jetpack/site/features' ) );

		remove_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$this->assertSame( 200, $response->get_status() );
		$slugs = array_column( $response->get_data()['features'], 'slug' );
		$this->assertNotContains( 'search', $slugs );
		$this->assertContains( 'boost', $slugs );
	}

	/**
	 * The boost feature's plugin status in a response.
	 *
	 * @param \WP_REST_Response $response The response.
	 * @return string
	 */
	private function boost_status( $response ) {
		return array_column( $response->get_data()['features'], 'plugin_status', 'slug' )['boost'];
	}

	/**
	 * @dataProvider mapped_plugin_copies
	 * @param string|null $active_copy Plugin copy already active before the request.
	 */
	#[DataProvider( 'mapped_plugin_copies' )]
	public function test_activates_and_deactivates_a_mapped_plugin( $active_copy ) {
		$plugins_filter = static function ( $plugins ) use ( $active_copy ) {
			if ( $active_copy ) {
				$plugins[ $active_copy ] = array( 'Name' => 'Boost' );
			}
			return $plugins;
		};
		add_filter( 'all_plugins', $plugins_filter );
		try {
			if ( $active_copy ) {
				update_option( 'active_plugins', array( $active_copy ) );
			}
			$activated = $this->send( 'jetpack-boost', 'activate' );
			$this->assertSame( 200, $activated->get_status() );
			$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( $activated ) );

			$deactivated = $this->send( 'jetpack-boost', 'deactivate' );
			$this->assertSame( 200, $deactivated->get_status() );
			$this->assertSame( Main_Features::PLUGIN_INACTIVE, $this->boost_status( $deactivated ) );
		} finally {
			remove_filter( 'all_plugins', $plugins_filter );
		}
	}

	public static function mapped_plugin_copies() {
		return array(
			'stable only'                        => array( null ),
			'dev active beside installed stable' => array( 'jetpack-boost-dev/jetpack-boost.php' ),
		);
	}

	/**
	 * @dataProvider offline_plugin_switches
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @param string $plugin Plugin slug.
	 * @param bool   $bulk Whether to use the bulk route.
	 */
	#[DataProvider( 'offline_plugin_switches' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_offline_plugin_switch_returns_local_state_with_copied_credentials( $plugin, $bulk ) {
		$file        = null;
		$original    = null;
		$created_dir = false;
		if ( $plugin !== 'jetpack-boost' ) {
			$folder      = WP_PLUGIN_DIR . '/' . $plugin;
			$created_dir = ! is_dir( $folder );
			if ( $created_dir ) {
				mkdir( $folder );
			}
			$file     = $folder . '/' . $plugin . '.php';
			$original = file_exists( $file ) ? file_get_contents( $file ) : null;
			file_put_contents( $file, "<?php\n/** Plugin Name: Offline switch fixture */\n" );
			wp_cache_delete( 'plugins', 'plugins' );
		}
		if ( $plugin === 'jetpack-boost' ) {
			update_option( 'jb_get_started', true );
		}
		$standalone_modules = function ( $modules ) {
			return array_merge( $modules, array( 'protect', 'publicize' ) );
		};
		add_filter( 'jetpack_get_available_standalone_modules', $standalone_modules, 10, 1 );
		\Automattic\Jetpack\Connection\Utils::init_default_constants();
		Jetpack_Options::update_option( 'blog_token', 'copiedkey.copiedsecret' );
		\Automattic\Jetpack\Status\Cache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		$attempts = array();
		$tripwire = function ( $response, $args, $url ) use ( &$attempts ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- WordPress HTTP filter signature.
			$attempts[] = $url;
			return new \WP_Error( 'unexpected_http', 'Offline switch attempted HTTP.' );
		};
		add_filter( 'pre_http_request', $tripwire, 10, 3 );
		try {
			\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog( '/sites/123', '1.1' );
			$this->assertCount( 1, $attempts, 'The signed control must reach the tripwire.' );
			$attempts  = array();
			$activated = $bulk ? $this->send_bulk(
				array(
					'active'  => true,
					'plugins' => array( $plugin ),
				)
			) : $this->send( $plugin, 'activate' );
			$this->assertSame( 200, $activated->get_status() );
			$state = $bulk ? $activated->get_data()['state'] : $activated->get_data();
			$this->assertSame( Main_Features::get_state( true ), $state );
			$this->assertSame( Main_Features::PLUGIN_ACTIVE, Main_Features::get_plugin_status( $plugin ) );
			if ( $plugin === 'jetpack-boost' ) {
				$this->assertFalse( get_option( 'jb_get_started', 'not_started' ) );
			}
			$this->assertSame( array(), $attempts );
			$this->assertSame( array(), Jetpack_Options::get_option( 'active_modules', array() ) );
		} finally {
			if ( $file ) {
				if ( null !== $original ) {
					file_put_contents( $file, $original );
				} else {
					unlink( $file );
				}
				if ( $created_dir ) {
					rmdir( dirname( $file ) );
				}
			}
			remove_filter( 'pre_http_request', $tripwire, 10 );
			remove_filter( 'jetpack_get_available_standalone_modules', $standalone_modules );
			remove_all_filters( 'jetpack_my_jetpack_offline_features' );
			remove_all_filters( 'jetpack_offline_mode' );
			\Automattic\Jetpack\Status\Cache::clear();
		}
	}

	/** @return array Offline plugin/route cases. */
	public static function offline_plugin_switches() {
		return array(
			'Boost single'   => array( 'jetpack-boost', false ),
			'Boost bulk'     => array( 'jetpack-boost', true ),
			'Backup single'  => array( 'jetpack-backup', false ),
			'Backup bulk'    => array( 'jetpack-backup', true ),
			'Search single'  => array( 'jetpack-search', false ),
			'Search bulk'    => array( 'jetpack-search', true ),
			'Protect single' => array( 'jetpack-protect', false ),
			'Social single'  => array( 'jetpack-social', false ),
		);
	}

	/**
	 * @dataProvider offline_module_routes
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @param bool   $plugin_route Whether to switch the Protect plugin or a module.
	 * @param string $module Module slug.
	 * @param bool   $active Whether the module should activate.
	 */
	#[DataProvider( 'offline_module_routes' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_offline_module_activation_respects_connection_requirement( $plugin_route, $module, $active ) {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		\Automattic\Jetpack\Status\Cache::clear();
		require __DIR__ . '/fixtures/offline-module-info.php';
		\Automattic\Jetpack\Connection\Utils::init_default_constants();
		Jetpack_Options::update_option( 'blog_token', 'copiedkey.copiedsecret' );
		$available = function ( $modules ) {
			return array_merge( $modules, array( 'protect', 'publicize', 'waf', 'markdown' ) );
		};
		add_filter( 'jetpack_get_available_standalone_modules', $available, 10, 1 );
		$activation_attempts = array();
		$record_activation   = function ( $slug ) use ( &$activation_attempts ) {
			$activation_attempts[] = $slug;
		};
		add_action( 'jetpack_pre_activate_module', $record_activation );
		$http_attempts = array();
		$tripwire      = function ( $response, $args, $url ) use ( &$http_attempts ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- WordPress HTTP filter signature.
			$http_attempts[] = $url;
			return new \WP_Error( 'unexpected_http', 'Offline module switch attempted HTTP.' );
		};
		add_filter( 'pre_http_request', $tripwire, 10, 3 );
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		try {
			\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog( '/sites/123', '1.1' );
			$this->assertCount( 1, $http_attempts, 'The signed control must reach the tripwire.' );
			$http_attempts = array();
			if ( $plugin_route ) {
				add_option( 'jetpack-protect_activated', true );
				Products\Protect::do_product_specific_activation( true, true );
				$this->assertFalse( get_option( 'jetpack-protect_activated' ) );
			} else {
				$response = $this->send_bulk(
					array(
						'active'  => true,
						'modules' => array( $module ),
					)
				);
				if ( ! $active ) {
					$this->assertSame( 'Could not be switched on: unavailable in Offline Mode.', $response->get_data()['failed'][0]['message'] );
				}
			}
			$this->assertSame( $active, ( new \Automattic\Jetpack\Modules() )->is_active( $module ) );
			$this->assertSame( $active ? array( $module ) : array(), $activation_attempts );
			$this->assertSame( array(), $http_attempts );
		} finally {
			remove_filter( 'pre_http_request', $tripwire, 10 );
			remove_filter( 'jetpack_get_available_standalone_modules', $available, 10 );
			remove_action( 'jetpack_pre_activate_module', $record_activation );
			remove_all_filters( 'jetpack_offline_mode' );
			remove_all_filters( 'jetpack_my_jetpack_offline_features' );
			\Automattic\Jetpack\Status\Cache::clear();
		}
	}

	/** @return array Protect activation entry points. */
	public static function offline_module_routes() {
		return array(
			'Protect product step' => array( true, 'protect', false ),
			'Protect bulk module'  => array( false, 'protect', false ),
			'WAF bulk module'      => array( false, 'waf', false ),
			'Social bulk module'   => array( false, 'publicize', false ),
			'local bulk module'    => array( false, 'markdown', true ),
		);
	}
	/**
	 * Switching a plugin on has to run the product's own activation step too, or a
	 * product that needs more than its plugin comes up half on.
	 */
	public function test_runs_the_products_own_activation_step() {
		// Boost writes this option from do_product_specific_activation() and nowhere else.
		// Watching the write rather than the value, which is false either way.
		$written = 0;
		add_filter(
			'pre_update_option_jb_get_started',
			function ( $value ) use ( &$written ) {
				++$written;
				return $value;
			}
		);

		$this->send( 'jetpack-boost', 'activate' );
		remove_all_filters( 'pre_update_option_jb_get_started' );

		$this->assertSame( 1, $written );
	}

	/**
	 * A plugin that carries My Jetpack, for the provider scan to find.
	 *
	 * @param string      $folder  The plugin's folder name.
	 * @param string|null $version Package version; 'package' copies this package's Initializer file,
	 *                            'directory' creates a directory in its place, and null leaves it missing.
	 * @return string The folder's path, for removal.
	 */
	private function add_carrier( $folder, $version = null ) {
		$root = WP_PLUGIN_DIR . '/' . $folder;

		if ( ! is_dir( $root . '/jetpack_vendor/automattic/jetpack-my-jetpack' ) ) {
			mkdir( $root . '/jetpack_vendor/automattic/jetpack-my-jetpack', 0777, true );
		}

		$this->carriers[] = $root;
		if ( null !== $version ) {
			$src = $root . '/jetpack_vendor/automattic/jetpack-my-jetpack/src';
			mkdir( $src );
			if ( 'package' === $version ) {
				copy( __DIR__ . '/../../src/class-initializer.php', $src . '/class-initializer.php' );
			} elseif ( 'directory' === $version ) {
				mkdir( $src . '/class-initializer.php' );
			} else {
				file_put_contents( $src . '/class-initializer.php', "<?php class Initializer { const PACKAGE_VERSION = '$version'; }" );
			}
		}

		return $root;
	}

	/**
	 * Several plugins carry My Jetpack and the autoloader picks one, so the one serving
	 * the page can be switched off while another is there to take over.
	 */
	public function test_another_active_plugin_carrying_my_jetpack_is_found() {
		$this->add_carrier( 'my-jetpack-carrier' );
		update_option( 'active_plugins', array( 'my-jetpack-carrier/my-jetpack-carrier.php' ) );

		$this->assertFalse( Main_Features::is_only_my_jetpack_provider( 'jetpack-boost' ) );
	}

	/**
	 * @dataProvider remaining_carriers
	 * @param array $versions Bundled versions or fixture types, in active plugin order.
	 * @param bool  $offline Whether the site is offline.
	 * @param bool  $enabled Whether offline Features is enabled.
	 * @param bool  $refused Whether the hosting plugin must stay active.
	 * @param bool  $network Whether the remaining carriers are network active.
	 * @param array $excluded_folders Other plugin folders being deactivated in the same request.
	 */
	#[DataProvider( 'remaining_carriers' )]
	public function test_remaining_carrier_must_support_the_current_page( $versions, $offline, $enabled, $refused, $network = false, $excluded_folders = array() ) {
		$files = array();
		foreach ( $versions as $index => $version ) {
			$folder = 'my-jetpack-carrier-' . $index;
			$this->add_carrier( $folder, $version );
			$files[] = $folder . '/plugin.php';
		}
		if ( $network ) {
			update_site_option( 'active_sitewide_plugins', array_fill_keys( $files, time() ) );
		} else {
			update_option( 'active_plugins', $files );
		}
		$offline_filter = $offline ? '__return_true' : '__return_false';
		$enabled_filter = $enabled ? '__return_true' : '__return_false';
		add_filter( 'jetpack_offline_mode', $offline_filter );
		add_filter( 'jetpack_my_jetpack_offline_features', $enabled_filter );
		\Automattic\Jetpack\Status\Cache::clear();
		try {
			$this->assertSame( $refused, Main_Features::is_only_my_jetpack_provider( 'jetpack-boost', $excluded_folders ) );
		} finally {
			remove_filter( 'jetpack_offline_mode', $offline_filter );
			remove_filter( 'jetpack_my_jetpack_offline_features', $enabled_filter );
			\Automattic\Jetpack\Status\Cache::clear();
		}
	}

	/** @return array Remaining carrier cases. */
	public static function remaining_carriers() {
		return array(
			'offline capable'      => array( array( '6.15.0' ), true, true, false ),
			'offline excluded'     => array( array( '6.15.0' ), true, true, true, false, array( 'my-jetpack-carrier-0' ) ),
			'offline older'        => array( array( '6.7.0' ), true, true, true ),
			'first opt-in release' => array( array( '6.10.0' ), true, true, true ),
			'later opt-in release' => array( array( '6.12.0' ), true, true, true ),
			'online older'         => array( array( '6.7.0' ), false, true, false ),
			'offline unknown'      => array( array( null ), true, true, true ),
			'offline opt out'      => array( array( '6.7.0' ), true, false, false ),
			'last older release'   => array( array( '6.14.0' ), true, true, true ),
			'older before newer'   => array( array( '6.7.0', '6.15.0' ), true, true, false ),
			'prerelease boundary'  => array( array( '6.15.0-alpha' ), true, true, true ),
			'prerelease suffix'    => array( array( '6.16.0-alpha' ), true, true, false ),
			'network active'       => array( array( '6.15.0' ), true, true, false, true ),
			'package initializer'  => array( array( 'package' ), true, true, version_compare( Initializer::PACKAGE_VERSION, Main_Features::MINIMUM_OFFLINE_FEATURES_VERSION, '<' ) ),
			'directory'            => array( array( 'directory' ), true, true, true ),
		);
	}

	/**
	 * The plugin being switched off does not count as its own replacement — without that
	 * the last copy of My Jetpack could be deactivated and take the page with it.
	 */
	public function test_the_plugin_being_deactivated_does_not_count_as_another_carrier() {
		// A folder of its own: the scan reads folder names, and reusing a real plugin's
		// would mean removing a directory this test did not create.
		$this->add_carrier( 'my-jetpack-host' );
		update_option( 'active_plugins', array( 'my-jetpack-host/my-jetpack-host.php' ) );

		$this->assertTrue( Main_Features::is_only_my_jetpack_provider( 'my-jetpack-host' ) );
	}

	/**
	 * An active plugin that does not carry My Jetpack is no replacement either.
	 */
	public function test_an_active_plugin_without_my_jetpack_is_not_a_carrier() {
		update_option( 'active_plugins', array( 'hello-dolly/hello.php' ) );

		$this->assertTrue( Main_Features::is_only_my_jetpack_provider( 'jetpack-boost' ) );
	}

	/**
	 * A plugin in a -dev folder serves the page just as well, and its folder never
	 * equals the slug a request carries.
	 */
	public function test_the_hosting_plugin_is_matched_by_folder_not_by_slug() {
		$this->assertFalse( Main_Features::is_hosting_plugin( 'jetpack-boost' ) );
	}

	/**
	 * Switching on what is already on must not re-run the product's activation step.
	 */
	public function test_activating_an_active_plugin_does_nothing_further() {
		$this->send( 'jetpack-boost', 'activate' );

		$written = 0;
		add_filter(
			'pre_update_option_jb_get_started',
			function ( $value ) use ( &$written ) {
				++$written;
				return $value;
			}
		);

		$response = $this->send( 'jetpack-boost', 'activate' );
		remove_all_filters( 'pre_update_option_jb_get_started' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $written );
	}

	public function test_refuses_a_plugin_the_map_does_not_name() {
		$response = $this->send( 'hello-dolly', 'activate' );

		// The enum is what confines this route to the map, so assert the argument was
		// rejected rather than the 400 an uninstalled plugin would earn anyway.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Installing is a bigger act than switching, so it takes a capability of its own.
	 */
	public function test_forbids_installing_without_the_capability() {
		$deny = function ( $caps ) {
			$caps['install_plugins'] = false;
			return $caps;
		};
		add_filter( 'user_has_cap', $deny );

		$response = $this->send( 'jetpack-boost', 'install' );

		remove_filter( 'user_has_cap', $deny );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'not_allowed', $response->get_data()['code'] );
	}

	/**
	 * DISALLOW_FILE_MODS stops administrators too, so the refusal must not blame their role.
	 */
	public function test_says_installs_are_off_when_file_changes_are_disallowed() {
		add_filter( 'file_mod_allowed', '__return_false' );

		$response = $this->send( 'zero-bs-crm', 'install' );
		$state    = $this->server->dispatch( new WP_REST_Request( 'GET', '/wpcom/v2/my-jetpack/site/features' ) );

		remove_filter( 'file_mod_allowed', '__return_false' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'install_disabled', $response->get_data()['code'] );
		$this->assertSame( Main_Features::INSTALLS_DISABLED, $state->get_data()['plugin_installs'] );
	}

	public function test_the_state_says_whether_the_user_may_install_plugins() {
		$get = function () {
			return $this->server->dispatch( new WP_REST_Request( 'GET', '/wpcom/v2/my-jetpack/site/features' ) )->get_data()['plugin_installs'];
		};

		$this->assertSame( Main_Features::INSTALLS_ALLOWED, $get() );

		$deny = function ( $caps ) {
			$caps['install_plugins'] = false;
			return $caps;
		};
		add_filter( 'user_has_cap', $deny );
		$denied = $get();
		remove_filter( 'user_has_cap', $deny );

		$this->assertSame( Main_Features::INSTALLS_NOT_PERMITTED, $denied );
	}

	public function test_explains_a_download_that_failed() {
		$fail = function () {
			return new \WP_Error( 'download_failed', 'Download failed.' );
		};
		add_filter( 'upgrader_pre_download', $fail );

		$response = $this->send( 'zero-bs-crm', 'install' );

		remove_filter( 'upgrader_pre_download', $fail );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'no_package', $response->get_data()['code'] );
		$this->assertStringContainsString( 'reach WordPress.org', $response->get_data()['message'] );
	}

	/**
	 * Without direct file access WordPress needs server credentials, which only the Plugins screen asks for.
	 */
	public function test_explains_a_filesystem_it_could_not_write_to() {
		$ftp = function () {
			return 'ftpext';
		};
		add_filter( 'filesystem_method', $ftp );

		$response = $this->send( 'zero-bs-crm', 'install' );

		remove_filter( 'filesystem_method', $ftp );

		$this->assertSame( 400, $response->get_status() );
		$this->assertStringStartsWith( 'fs_', $response->get_data()['code'] );
		$this->assertStringContainsString( 'Plugins screen', $response->get_data()['message'] );
	}

	/**
	 * A module that refuses to switch on does not undo the plugin that is now active, so
	 * the route reports the state rather than an error the caller would retry forever.
	 */
	public function test_a_failed_module_activation_does_not_fail_the_plugin_action() {
		add_filter( 'jetpack_get_available_standalone_modules', '__return_empty_array' );

		$response = $this->send( 'jetpack-boost', 'activate' );

		remove_filter( 'jetpack_get_available_standalone_modules', '__return_empty_array' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( $response ) );
	}

	public function test_refuses_to_deactivate_jetpack() {
		$response = $this->send( 'jetpack', 'deactivate' );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'not_allowed', $response->get_data()['code'] );
	}

	public function test_forbids_users_who_cannot_activate_plugins() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'test_editor',
					'user_pass'  => '123',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( 403, $this->send( 'jetpack-boost', 'activate' )->get_status() );
	}

	/**
	 * Send one bulk request.
	 *
	 * @param array $params The request body.
	 * @return \WP_REST_Response
	 */
	private function send_bulk( $params ) {
		$request = new WP_REST_Request( 'POST', self::BULK_ROUTE );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params, JSON_UNESCAPED_SLASHES ) );

		return $this->server->dispatch( $request );
	}

	/**
	 * Let the current user manage modules, which the sync package would otherwise grant.
	 *
	 * @param array $caps The user's capabilities.
	 * @return array
	 */
	public function grant_manage_modules( $caps ) {
		$caps['jetpack_manage_modules'] = true;
		return $caps;
	}

	public function test_bulk_switches_plugins_and_returns_the_fresh_state() {
		$this->activate_jetpack();

		$on = $this->send_bulk(
			array(
				'active'  => true,
				'plugins' => array( 'jetpack-boost' ),
			)
		);

		$this->assertSame( 200, $on->get_status() );
		$this->assertSame( array(), $on->get_data()['failed'] );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( new \WP_REST_Response( $on->get_data()['state'] ) ) );

		$off = $this->send_bulk(
			array(
				'active'  => false,
				'plugins' => array( 'jetpack-boost' ),
			)
		);

		$this->assertSame( Main_Features::PLUGIN_INACTIVE, $this->boost_status( new \WP_REST_Response( $off->get_data()['state'] ) ) );
	}

	/**
	 * @dataProvider bulk_carrier_orders
	 * @param string $scenario Plugin order or a batch naming capable Jetpack and the host.
	 * @param bool   $host_refused Whether the hosting plugin must remain active.
	 */
	#[DataProvider( 'bulk_carrier_orders' )]
	public function test_offline_bulk_keeps_a_capable_features_provider( $scenario, $host_refused ) {
		$process = proc_open(
			array( PHP_BINARY, '-d', 'display_errors=stderr', __DIR__ . '/fixtures/offline-bulk-handoff.php', $scenario ),
			array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), array( 'pipe', 'w' ) ),
			$pipes
		);
		$this->assertIsResource( $process );
		fclose( $pipes[0] );
		$output = stream_get_contents( $pipes[1] );
		$errors = stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$this->assertSame( 0, proc_close( $process ), $errors );
		$result = (array) json_decode( $output, true );
		$this->assertSame( 'jetpack-videopress', $result['host'] );
		$this->assertSame( 200, $result['status'] );
		$this->assertSame( array( $host_refused ? 'jetpack-videopress' : 'jetpack' ), array_column( $result['failed'], 'slug' ) );
		$this->assertSame( 'This plugin runs the page you are on, so it cannot be deactivated from here.', $result['failed'][0]['message'] );
		$this->assertSame( $host_refused, in_array( 'jetpack-videopress/jetpack-videopress.php', $result['active'], true ) );
		$this->assertSame( ! $host_refused, in_array( 'jetpack-boost/jetpack-boost.php', $result['active'], true ) );
		$this->assertContains( 'jetpack/jetpack.php', $result['active'] );
	}

	/** @return array Bulk carrier orders. */
	public static function bulk_carrier_orders() {
		return array(
			'host first'            => array( 'host-first', true ),
			'capable Jetpack named' => array( 'jetpack-and-host', false ),
		);
	}

	/**
	 * A bulk action's fresh state must not hand back a feature a host hid.
	 */
	public function test_bulk_state_leaves_out_what_a_host_hid() {
		$this->activate_jetpack();
		$hide = function ( $states ) {
			$states['search'] = 'hidden';
			return $states;
		};
		add_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$response = $this->send_bulk(
			array(
				'active'  => true,
				'plugins' => array( 'jetpack-boost' ),
			)
		);

		remove_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$slugs = array_column( $response->get_data()['state']['features'], 'slug' );
		$this->assertNotContains( 'search', $slugs );
		$this->assertContains( 'boost', $slugs );
	}

	/**
	 * One refusal must not stop the rest of the batch, and must say why it was refused.
	 */
	public function test_bulk_reports_a_refusal_and_carries_on() {
		$this->activate_jetpack();
		$this->send( 'jetpack-boost', 'activate' );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'plugins' => array( 'jetpack', 'jetpack-boost' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'type'    => 'plugin',
					'slug'    => 'jetpack',
					'message' => 'This plugin runs the page you are on, so it cannot be deactivated from here.',
				),
			),
			$response->get_data()['failed']
		);
		$this->assertSame( Main_Features::PLUGIN_INACTIVE, $this->boost_status( new \WP_REST_Response( $response->get_data()['state'] ) ) );
	}

	public function test_bulk_switches_a_module() {
		$this->offer_stats_module();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'modules' => array( 'stats' ),
			)
		);

		$this->assertSame( array(), $response->get_data()['failed'] );
		$this->assertNotContains( 'stats', Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	/**
	 * @dataProvider protect_page_bulk_switches
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @param bool   $dashboard Whether the Protect page owns the security modules.
	 * @param bool   $active Whether to activate the modules.
	 * @param bool   $can_manage Whether the user can manage modules.
	 * @param bool   $security_active Whether security modules start active.
	 * @param array  $expected_failed Expected failed module slugs.
	 * @param string $expected_message Expected failure message.
	 * @param bool   $expected_security_active Expected security module state.
	 * @param bool   $expected_stats_active Expected stats module state.
	 * @param bool   $include_dashboard Whether the batch also switches the Protect page.
	 * @param bool   $force_dashboard Whether the host forces the Protect page on.
	 */
	#[DataProvider( 'protect_page_bulk_switches' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_bulk_respects_protect_page_ownership( $dashboard, $active, $can_manage, $security_active, $expected_failed, $expected_message, $expected_security_active, $expected_stats_active, $include_dashboard = false, $force_dashboard = false ) {
		$security = array( 'waf', 'protect', 'account-protection', 'sso', 'monitor' );
		$modules  = array_merge( $security, array( 'stats' ) );
		if ( $include_dashboard ) {
			if ( $active ) {
				array_unshift( $modules, 'protect-dashboard' );
			} else {
				$modules[] = 'protect-dashboard';
			}
		}
		$offer = fn( $available ) => array_values( array_unique( array_merge( $available, $modules ) ) );
		add_filter( 'jetpack_get_available_standalone_modules', $offer );
		if ( $can_manage ) {
			add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		}
		$initial_modules = array_merge( $security_active ? $security : array(), $active ? array() : array( 'stats' ) );
		if ( $include_dashboard ) {
			$initial_modules[] = 'protect-dashboard';
		}
		Jetpack_Options::update_option( 'active_modules', $initial_modules );
		if ( $force_dashboard ) {
			add_filter( 'jetpack_active_modules', fn( $active_modules ) => array_values( array_unique( array_merge( $active_modules, array( 'protect-dashboard' ) ) ) ) );
		}
		if ( $dashboard ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}

		$response = $this->send_bulk(
			array(
				'active'  => $active,
				'modules' => $modules,
			)
		);
		$this->assertSame( 200, $response->get_status() );
		$failed = $response->get_data()['failed'];
		$this->assertSame( $expected_failed, array_column( $failed, 'slug' ) );
		foreach ( $failed as $failure ) {
			$this->assertSame( 'module', $failure['type'] );
			$message = $force_dashboard && 'protect-dashboard' === $failure['slug']
				? 'Stays on: enabled by your host or site administrator.'
				: $expected_message;
			$this->assertSame( $message, $failure['message'] );
		}
		$saved = Jetpack_Options::get_option( 'active_modules', array() );
		foreach ( $security as $slug ) {
			$this->assertSame( $expected_security_active, in_array( $slug, $saved, true ), $slug );
		}
		$this->assertSame( $expected_stats_active, in_array( 'stats', $saved, true ) );
		if ( $include_dashboard ) {
			$this->assertSame( $active || $force_dashboard, ( new Modules() )->is_active( 'protect-dashboard' ) );
		}
	}

	public static function protect_page_bulk_switches() {
		return array(
			'Protect page on, already active'     => array(
				'dashboard'                => true,
				'active'                   => true,
				'can_manage'               => true,
				'security_active'          => true,
				'expected_failed'          => array( 'waf', 'protect', 'account-protection', 'sso', 'monitor' ),
				'expected_message'         => 'Managed in Protect. Change these settings on the Protect page.',
				'expected_security_active' => true,
				'expected_stats_active'    => true,
			),
			'Protect page on, deactivate'         => array(
				'dashboard'                => true,
				'active'                   => false,
				'can_manage'               => true,
				'security_active'          => true,
				'expected_failed'          => array( 'waf', 'protect', 'account-protection', 'sso', 'monitor' ),
				'expected_message'         => 'Managed in Protect. Change these settings on the Protect page.',
				'expected_security_active' => true,
				'expected_stats_active'    => false,
			),
			'Protect page deactivated in batch'   => array(
				'dashboard'                => true,
				'active'                   => false,
				'can_manage'               => true,
				'security_active'          => true,
				'expected_failed'          => array(),
				'expected_message'         => '',
				'expected_security_active' => false,
				'expected_stats_active'    => false,
				'include_dashboard'        => true,
			),
			'Protect page forced on in batch'     => array(
				'dashboard'                => true,
				'active'                   => false,
				'can_manage'               => true,
				'security_active'          => true,
				'expected_failed'          => array( 'protect-dashboard', 'waf', 'protect', 'account-protection', 'sso', 'monitor' ),
				'expected_message'         => 'Managed in Protect. Change these settings on the Protect page.',
				'expected_security_active' => true,
				'expected_stats_active'    => false,
				'include_dashboard'        => true,
				'force_dashboard'          => true,
			),
			'Protect page included in activation' => array(
				'dashboard'                => true,
				'active'                   => true,
				'can_manage'               => true,
				'security_active'          => false,
				'expected_failed'          => array( 'waf', 'protect', 'account-protection', 'sso', 'monitor' ),
				'expected_message'         => 'Managed in Protect. Change these settings on the Protect page.',
				'expected_security_active' => false,
				'expected_stats_active'    => true,
				'include_dashboard'        => true,
			),
			'Protect page off, activate'          => array(
				'dashboard'                => false,
				'active'                   => true,
				'can_manage'               => true,
				'security_active'          => false,
				'expected_failed'          => array(),
				'expected_message'         => '',
				'expected_security_active' => true,
				'expected_stats_active'    => true,
			),
			'capability refusal wins'             => array(
				'dashboard'                => true,
				'active'                   => false,
				'can_manage'               => false,
				'security_active'          => true,
				'expected_failed'          => array( 'waf', 'protect', 'account-protection', 'sso', 'monitor', 'stats' ),
				'expected_message'         => 'You are not allowed to manage Jetpack modules on this site.',
				'expected_security_active' => true,
				'expected_stats_active'    => true,
			),
		);
	}

	/**
	 * A module a host forces on is reported as staying on, not switched off.
	 */
	public function test_bulk_reports_a_module_a_host_forced_on() {
		$this->offer_stats_module();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );
		$force = fn( $modules ) => array_values( array_unique( array_merge( $modules, array( 'stats' ) ) ) );
		add_filter( 'jetpack_active_modules', $force );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'modules' => array( 'stats' ),
			)
		);

		remove_filter( 'jetpack_active_modules', $force );

		$failed = $response->get_data()['failed'];
		$this->assertCount( 1, $failed );
		$this->assertStringContainsString( 'enabled by your host or site administrator', $failed[0]['message'] );
	}

	/**
	 * Offer the stats module, through whichever filter applies: Jetpack's own list when the
	 * Jetpack plugin is present, the standalone list otherwise.
	 *
	 * @return void
	 */
	private function offer_stats_module() {
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_stats_with_version' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_stats' ) );
	}

	/**
	 * Stop offering the stats module.
	 *
	 * @return void
	 */
	private function withdraw_stats_module() {
		remove_filter( 'jetpack_get_available_modules', array( $this, 'add_stats_with_version' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_stats' ) );
	}

	/**
	 * Available modules as the Jetpack plugin reports them: slug => version.
	 *
	 * @param array $modules Available modules.
	 * @return array
	 */
	public function add_stats_with_version( $modules ) {
		$modules['stats'] = '0.0.0';
		return $modules;
	}

	/**
	 * Available modules as a standalone plugin reports them: a list of slugs.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function add_stats( $modules ) {
		$modules[] = 'stats';
		return array_values( array_unique( $modules ) );
	}

	/**
	 * Switching modules takes the capability Jetpack's own module route asks for.
	 */
	public function test_bulk_refuses_modules_without_the_capability() {
		$this->offer_stats_module();
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'modules' => array( 'stats' ),
			)
		);

		$this->assertSame( 'module', $response->get_data()['failed'][0]['type'] );
		$this->assertContains( 'stats', Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	public function test_bulk_reports_an_unknown_module() {
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );

		$response = $this->send_bulk(
			array(
				'active'  => true,
				'modules' => array( 'not-a-module' ),
			)
		);

		$this->assertSame( 'That Jetpack module was not found.', $response->get_data()['failed'][0]['message'] );
	}

	public function test_bulk_refuses_a_plugin_the_map_does_not_name() {
		$response = $this->send_bulk(
			array(
				'active'  => true,
				'plugins' => array( 'hello-dolly' ),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function test_bulk_forbids_users_who_cannot_manage_modules() {
		$this->activate_jetpack();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'bulk_editor',
					'user_pass'  => '123',
					'role'       => 'editor',
				)
			)
		);

		add_filter( 'map_meta_cap', array( $this, 'map_module_caps' ), 10, 2 );

		$this->assertSame( 403, $this->send_bulk( array( 'active' => true ) )->get_status() );
	}

	/**
	 * Map the module capabilities to manage_options, as the sync package does on a real site.
	 *
	 * @param string[] $caps The primitive capabilities required.
	 * @param string   $cap  The capability checked.
	 * @return string[]
	 */
	public function map_module_caps( $caps, $cap ) {
		return 'jetpack_manage_modules' === $cap ? array( 'manage_options' ) : $caps;
	}

	/**
	 * Withhold plugin changes from the current user, as some hosts do from administrators.
	 *
	 * @param array $caps The user's capabilities.
	 * @return array
	 */
	public function deny_activate_plugins( $caps ) {
		$caps['activate_plugins'] = false;
		return $caps;
	}

	public function test_bulk_forbids_module_batches_from_administrators_who_cannot_activate_plugins_without_jetpack() {
		$this->offer_stats_module();
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );
		add_filter( 'map_meta_cap', array( $this, 'map_module_caps' ), 10, 2 );
		add_filter( 'user_has_cap', array( $this, 'deny_activate_plugins' ) );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'modules' => array( 'stats' ),
			)
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assertContains( 'stats', Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	/**
	 * @dataProvider bulk_directions
	 *
	 * @param bool $active Whether the batch switches on.
	 */
	#[DataProvider( 'bulk_directions' )]
	public function test_bulk_refuses_plugin_rows_to_administrators_who_cannot_activate_plugins( $active ) {
		$this->activate_jetpack();
		if ( ! $active ) {
			$this->send( 'jetpack-boost', 'activate' );
		}
		$this->offer_stats_module();
		$plan             = Current_Plan::get();
		$plan['supports'] = array_merge( (array) ( $plan['supports'] ?? array() ), array( 'stats' ) );
		$this->set_plan_cache( $plan );
		Jetpack_Options::update_option( 'active_modules', $active ? array() : array( 'stats' ) );
		add_filter( 'map_meta_cap', array( $this, 'map_module_caps' ), 10, 2 );
		add_filter( 'user_has_cap', array( $this, 'deny_activate_plugins' ) );

		$response = $this->send_bulk(
			array(
				'active'  => $active,
				'plugins' => array( 'jetpack-boost' ),
				'modules' => array( 'stats' ),
			)
		);

		$this->assertSame(
			array(
				array(
					'type'    => 'plugin',
					'slug'    => 'jetpack-boost',
					'message' => 'Your account can’t activate or deactivate plugins on this site.',
				),
			),
			$response->get_data()['failed']
		);
		$this->assertSame(
			$active ? Main_Features::PLUGIN_INACTIVE : Main_Features::PLUGIN_ACTIVE,
			$this->boost_status( new \WP_REST_Response( $response->get_data()['state'] ) )
		);
		$this->assertSame( $active, in_array( 'stats', Jetpack_Options::get_option( 'active_modules', array() ), true ) );
	}

	public static function bulk_directions() {
		return array(
			'activate'   => array( true ),
			'deactivate' => array( false ),
		);
	}

	/**
	 * Install the Jetpack plugin mock and switch it on.
	 *
	 * @return void
	 */
	private function activate_jetpack() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack/jetpack.php' ) ) {
			if ( ! is_dir( WP_PLUGIN_DIR . '/jetpack' ) ) {
				mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
			}
			copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
			wp_cache_delete( 'plugins', 'plugins' );
			$this->installed_jetpack = true;
		}

		update_option( 'active_plugins', array_merge( (array) get_option( 'active_plugins', array() ), array( 'jetpack/jetpack.php' ) ) );
	}

	/**
	 * Remove the Jetpack plugin mock, if a test installed it.
	 *
	 * @return void
	 */
	private function remove_jetpack() {
		if ( $this->installed_jetpack ) {
			unlink( WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
			rmdir( WP_PLUGIN_DIR . '/jetpack' );
			wp_cache_delete( 'plugins', 'plugins' );
			$this->installed_jetpack = false;
		}
	}

	/**
	 * Without Jetpack, any plugin in the batch may be the last one carrying My Jetpack, so none
	 * is switched off and each says why.
	 */
	public function test_bulk_deactivates_no_plugin_while_jetpack_is_inactive() {
		$this->send( 'jetpack-boost', 'activate' );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'plugins' => array( 'jetpack-boost' ),
			)
		);

		$this->assertSame( 'jetpack-boost', $response->get_data()['failed'][0]['slug'] );
		$this->assertStringContainsString( 'while the Jetpack plugin is active', $response->get_data()['failed'][0]['message'] );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( new \WP_REST_Response( $response->get_data()['state'] ) ) );
	}

	/**
	 * Switching plugins on is never refused, Jetpack or not.
	 */
	public function test_bulk_activates_plugins_while_jetpack_is_inactive() {
		$response = $this->send_bulk(
			array(
				'active'  => true,
				'plugins' => array( 'jetpack-boost' ),
			)
		);

		$this->assertSame( array(), $response->get_data()['failed'] );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( new \WP_REST_Response( $response->get_data()['state'] ) ) );
	}

	/**
	 * A batch of plugins and modules switches both, and reports each failure against its own kind.
	 */
	public function test_bulk_switches_plugins_and_modules_together() {
		$this->activate_jetpack();
		$this->send( 'jetpack-boost', 'activate' );
		$this->offer_stats_module();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$response = $this->send_bulk(
			array(
				'active'  => false,
				'plugins' => array( 'jetpack-boost' ),
				'modules' => array( 'stats', 'not-a-module' ),
			)
		);

		$this->assertSame(
			array(
				array(
					'type'    => 'module',
					'slug'    => 'not-a-module',
					'message' => 'That Jetpack module was not found.',
				),
			),
			$response->get_data()['failed']
		);
		$this->assertSame( Main_Features::PLUGIN_INACTIVE, $this->boost_status( new \WP_REST_Response( $response->get_data()['state'] ) ) );
		$this->assertNotContains( 'stats', Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	/**
	 * The activate direction runs through Modules::activate(), which does the most work.
	 */
	public function test_bulk_switches_a_module_on() {
		$this->offer_stats_module();
		// Once another test has loaded the Jetpack mock, activation also asks the plan.
		$plan             = Current_Plan::get();
		$plan['supports'] = array_merge( (array) ( $plan['supports'] ?? array() ), array( 'stats' ) );
		$this->set_plan_cache( $plan );
		add_filter( 'user_has_cap', array( $this, 'grant_manage_modules' ) );

		$response = $this->send_bulk(
			array(
				'active'  => true,
				'modules' => array( 'stats' ),
			)
		);

		$this->assertSame( array(), $response->get_data()['failed'] );
		$this->assertContains( 'stats', Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	/**
	 * Write Current_Plan's request-scoped cache, which has no setter.
	 *
	 * @param array|null $plan Plan details, or null to clear.
	 * @return void
	 */
	private function set_plan_cache( $plan ) {
		$cache = new \ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$cache->setAccessible( true );
		}
		$cache->setValue( null, $plan );
	}
}
