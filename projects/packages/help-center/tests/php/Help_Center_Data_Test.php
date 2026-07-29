<?php
/**
 * Tests for Help_Center::get_help_center_data().
 *
 * @package automattic/jetpack-help-center
 */

use Automattic\Jetpack\Help_Center\Help_Center;
use Automattic\Jetpack\Help_Center\WP_REST_Help_Center_Support_Activity;
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Help_Center_Data_Test
 */
class Help_Center_Data_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	/**
	 * @var Help_Center
	 */
	private $help_center;

	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login'   => 'help_center_user',
				'user_pass'    => 'password',
				'user_email'   => 'help_center_user@example.com',
				'display_name' => 'Help Center User',
				'role'         => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		$this->help_center = new Help_Center();
	}

	public function tear_down() {
		// The Help_Center constructor registers hooks against $this. Without this,
		// each test would leak duplicate callbacks into later tests in the session.
		self::remove_help_center_hooks( $this->help_center );

		// test_get_instance_returns_singleton_after_init may have populated the
		// class-static singleton via init(); reset it so later tests start clean.
		$singleton = Help_Center::get_instance();
		if ( $singleton !== null ) {
			self::remove_help_center_hooks( $singleton );
			$property = new \ReflectionProperty( Help_Center::class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, null );
		}

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	private static function remove_help_center_hooks( Help_Center $instance ): void {
		remove_action( 'rest_api_init', array( $instance, 'register_rest_api' ) );
		remove_filter( 'calypso_preferences_update', array( $instance, 'calypso_preferences_update' ) );
		remove_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_wp_admin_scripts' ), 100 );
		remove_action( 'wp_enqueue_scripts', array( $instance, 'enqueue_wp_admin_scripts' ), 100 );
		remove_action( 'next_admin_init', array( $instance, 'enqueue_wp_admin_scripts' ), 1000 );
		remove_filter( 'in_admin_header', array( $instance, 'jetpack_remove_core_help_tab' ) );
	}

	public function test_payload_has_stable_top_level_keys() {
		// Adding a field is a deliberate change — frontend consumers depend on this shape.
		$this->assertSame(
			array(
				'isProxied',
				'isSU',
				'isSSP',
				'sectionName',
				'isCommerceGarden',
				'currentUser',
				'site',
				'locale',
			),
			array_keys( $this->help_center->get_help_center_data( 'wp-admin' ) )
		);
	}

	public function test_current_user_block_reflects_logged_in_user() {
		$current_user = $this->help_center->get_help_center_data( 'wp-admin' )['currentUser'];

		$this->assertSame( $this->user_id, $current_user['ID'] );
		$this->assertSame( 'help_center_user', $current_user['username'] );
		$this->assertSame( 'Help Center User', $current_user['display_name'] );
		$this->assertSame( 'help_center_user@example.com', $current_user['email'] );
	}

	/**
	 * @dataProvider variant_section_name_provider
	 */
	#[DataProvider( 'variant_section_name_provider' )]
	public function test_variant_drives_section_name_default( string $variant, string $expected ) {
		$this->assertSame(
			$expected,
			$this->help_center->get_help_center_data( $variant )['sectionName']
		);
	}

	public static function variant_section_name_provider(): array {
		return array(
			'wp-admin'   => array( 'wp-admin', 'wp-admin' ),
			'gutenberg'  => array( 'gutenberg', 'gutenberg' ),
			'customizer' => array( 'customizer', 'customizer' ),
			'ciab-admin' => array( 'ciab-admin', 'ciab-admin' ),
			'logged-out' => array( 'logged-out', 'logged-out' ),
		);
	}

	public function test_default_variant_is_wp_admin() {
		$this->assertSame( 'wp-admin', $this->help_center->get_help_center_data()['sectionName'] );
	}

	public function test_overrides_shallow_merge_top_level_and_replace_subarrays() {
		$data = $this->help_center->get_help_center_data(
			'wp-admin',
			array(
				'sectionName' => 'landpack',
				'currentUser' => array( 'ID' => 0 ),
			)
		);

		$this->assertSame( 'landpack', $data['sectionName'], 'top-level override replaces' );
		$this->assertSame( array( 'ID' => 0 ), $data['currentUser'], 'sub-array override replaces wholesale (no deep merge)' );
		$this->assertSame( 'en', $data['locale'], 'untouched fields keep computed values' );
	}

	public function test_get_instance_returns_singleton_after_init() {
		Help_Center::init();
		$this->assertInstanceOf( Help_Center::class, Help_Center::get_instance() );
	}

	public function test_consumer_can_load_logged_out_bundle_on_frontend() {
		wp_set_current_user( 0 );
		set_transient(
			'help-center-asset-logged-out.asset.json',
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			),
			HOUR_IN_SECONDS
		);

		$should_load = static function () {
			return true;
		};
		add_filter( 'jetpack_help_center_should_load_logged_out', $should_load );

		try {
			$this->help_center->enqueue_wp_admin_scripts();

			$this->assertTrue( wp_script_is( 'help-center', 'enqueued' ) );
			$this->assertStringContainsString(
				'help-center-logged-out.min.js',
				wp_scripts()->registered['help-center']->src
			);
			$this->assertTrue( wp_style_is( 'help-center-logged-out-style', 'enqueued' ) );
		} finally {
			remove_filter( 'jetpack_help_center_should_load_logged_out', $should_load );
			delete_transient( 'help-center-asset-logged-out.asset.json' );
			wp_dequeue_script( 'help-center' );
			wp_deregister_script( 'help-center' );
			wp_dequeue_style( 'help-center-logged-out-style' );
			wp_deregister_style( 'help-center-logged-out-style' );
		}
	}

	public function test_rest_proxy_routes_allow_logged_out_requests() {
		wp_set_current_user( 0 );
		$this->help_center->register_rest_api();

		$routes = rest_get_server()->get_routes( 'help-center' );
		$this->assertNotEmpty( $routes );

		foreach ( $routes as $route_handlers ) {
			foreach ( $route_handlers as $handler ) {
				if ( isset( $handler['permission_callback'] ) ) {
					$this->assertSame( '__return_true', $handler['permission_callback'] );
				}
			}
		}
	}

	public function test_init_uses_filtered_wpcom_request_client() {
		$wpcom_request_client = new class() implements Wpcom_Request_Client {
			public function is_user_connected() {
				return true;
			}

			public function request(
				$path,
				$version = '2',
				$args = array(),
				$body = null,
				$base_api_path = 'wpcom'
			) {
				return compact( 'path', 'version', 'args', 'body', 'base_api_path' );
			}
		};

		$filter = static function () use ( $wpcom_request_client ) {
			return $wpcom_request_client;
		};
		add_filter( 'jetpack_help_center_wpcom_request_client', $filter );

		$help_center = null;
		try {
			$help_center = Help_Center::init();
		} finally {
			remove_filter( 'jetpack_help_center_wpcom_request_client', $filter );
		}

		$this->assertInstanceOf( Help_Center::class, $help_center );
		$property = new \ReflectionProperty( Help_Center::class, 'wpcom_request_client' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertSame( $wpcom_request_client, $property->getValue( $help_center ) );
	}

	public function test_rest_controller_uses_injected_wpcom_request_client() {
		$wpcom_request_client = new class() implements Wpcom_Request_Client {
			/**
			 * Captured requests.
			 *
			 * @var array
			 */
			public $requests = array();

			public function is_user_connected() {
				return true;
			}

			public function request(
				$path,
				$version = '2',
				$args = array(),
				$body = null,
				$base_api_path = 'wpcom'
			) {
				$this->requests[] = compact( 'path', 'version', 'args', 'body', 'base_api_path' );
				return array( 'body' => '{"items":[]}' );
			}
		};

		$controller = new WP_REST_Help_Center_Support_Activity( $wpcom_request_client );
		$controller->get_support_activity();

		$this->assertSame(
			array(
				array(
					'path'          => '/support-activity',
					'version'       => '2',
					'args'          => array(),
					'body'          => null,
					'base_api_path' => 'wpcom',
				),
			),
			$wpcom_request_client->requests
		);
	}

	public function test_connection_status_uses_injected_wpcom_request_client() {
		$wpcom_request_client = new class() implements Wpcom_Request_Client {
			public function is_user_connected() {
				return true;
			}

			public function request(
				$path,
				$version = '2',
				$args = array(),
				$body = null,
				$base_api_path = 'wpcom'
			) {
				return compact( 'path', 'version', 'args', 'body', 'base_api_path' );
			}
		};
		$help_center          = new Help_Center( $wpcom_request_client );
		$is_jetpack_site      = static function () {
			return true;
		};

		add_filter( 'is_jetpack_site', $is_jetpack_site );
		try {
			$this->assertFalse( $help_center->is_jetpack_disconnected() );
		} finally {
			remove_filter( 'is_jetpack_site', $is_jetpack_site );
			self::remove_help_center_hooks( $help_center );
		}
	}
}
