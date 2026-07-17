<?php
/**
 * Tests for the Atomic plugin-state REST route.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State\Plugin_State_REST_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WpOrg\Requests\Requests;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-state/class-plugin-state-rest-controller.php';

/**
 * Tests for the Atomic plugin-state REST route.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State\Plugin_State_REST_Controller
 */
#[CoversClass( Plugin_State_REST_Controller::class )]
class Plugin_State_REST_Test extends \WorDBless\BaseTestCase {

	/**
	 * Plugin directories created by a test.
	 *
	 * @var string[]
	 */
	private $created_dirs = array();

	/**
	 * The callback watching `pre_http_request`, if a test registered one.
	 *
	 * @var callable|null
	 */
	private $http_spy = null;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( 0 );
		add_action( 'rest_api_init', array( $this, 'register_route' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		foreach ( $this->created_dirs as $dir ) {
			$this->rrmdir( $dir );
		}
		$this->created_dirs = array();

		$this->set_auth_state( null, null );
		remove_action( 'rest_api_init', array( $this, 'register_route' ) );

		// Removed here rather than at the end of the test, so a failed assertion cannot leak it.
		if ( null !== $this->http_spy ) {
			remove_filter( 'pre_http_request', $this->http_spy );
			$this->http_spy = null;
		}

		parent::tear_down();
	}

	/**
	 * Register the route under test.
	 */
	public function register_route() {
		( new Plugin_State_REST_Controller() )->register_routes();
	}

	/**
	 * Set how Rest_Authentication sees the current request. The properties are private with
	 * no setter, so reflection is the seam.
	 *
	 * @param bool|null   $status The authentication status.
	 * @param string|null $type   The token type.
	 */
	private function set_auth_state( $status, $type ) {
		$instance   = Rest_Authentication::init();
		$reflection = new ReflectionClass( Rest_Authentication::class );

		foreach ( array(
			'rest_authentication_status' => $status,
			'rest_authentication_type'   => $type,
		) as $name => $value ) {
			$property = $reflection->getProperty( $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( $instance, $value );
		}
	}

	/**
	 * Create a file inside a plugin directory.
	 *
	 * @param string $dir_name The directory under WP_PLUGIN_DIR.
	 * @param string $file     The file to create, relative to that directory.
	 * @param bool   $header   Whether the file carries a plugin header.
	 * @param string $name     The plugin display name, which is what get_plugins() sorts on.
	 */
	private function make_plugin( $dir_name, $file, $header = true, $name = 'Test Plugin' ) {
		$dir = WP_PLUGIN_DIR . '/' . $dir_name;
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0777, true );
		}
		$this->created_dirs[] = $dir;

		$path = $dir . '/' . $file;
		if ( ! is_dir( dirname( $path ) ) ) {
			mkdir( dirname( $path ), 0777, true );
		}

		file_put_contents(
			$path,
			$header ? "<?php\n/*\n * Plugin Name: $name\n * Version: 1.0\n */\n" : "<?php\n// Not a plugin.\n"
		);
	}

	/**
	 * Recursively remove a directory.
	 *
	 * @param string $dir The directory.
	 */
	private function rrmdir( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		foreach ( array_diff( scandir( $dir ), array( '.', '..' ) ) as $entry ) {
			$path = $dir . '/' . $entry;
			if ( is_dir( $path ) ) {
				$this->rrmdir( $path );
			} else {
				unlink( $path );
			}
		}
		rmdir( $dir );
	}

	/**
	 * Dispatch a request for a slug.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return WP_REST_Response
	 */
	private function request( $slug ) {
		return rest_do_request( new WP_REST_Request( Requests::GET, '/wpcom/v2/plugin-state/' . $slug ) );
	}

	/**
	 * The reported state, including an absent plugin being a 200 rather than an error.
	 *
	 * @param string|null $file     File to create in a `give` directory, or null to create no directory.
	 * @param bool        $header   Whether that file carries a plugin header.
	 * @param string[]    $active   Contents of `active_plugins`.
	 * @param array       $expected The expected response body.
	 * @dataProvider plugin_state_provider
	 */
	#[DataProvider( 'plugin_state_provider' )]
	public function test_plugin_state( $file, $header, $active, $expected ) {
		$this->set_auth_state( true, 'blog' );
		if ( null !== $file ) {
			$this->make_plugin( 'give', $file, $header );
		}
		update_option( 'active_plugins', $active );

		$response = $this->request( 'give' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $expected, $response->get_data() );
	}

	/**
	 * Data for test_plugin_state.
	 *
	 * @return array
	 */
	public static function plugin_state_provider() {
		return array(
			'active'           => array(
				'give.php',
				true,
				array( 'give/give.php' ),
				array(
					'slug'      => 'give',
					'installed' => true,
					'id'        => 'give/give',
					'active'    => true,
				),
			),
			'inactive'         => array(
				'give.php',
				true,
				array(),
				array(
					'slug'      => 'give',
					'installed' => true,
					'id'        => 'give/give',
					'active'    => false,
				),
			),
			'not installed'    => array(
				null,
				true,
				array(),
				array(
					'slug'      => 'give',
					'installed' => false,
				),
			),
			'no plugin header' => array(
				'give.php',
				false,
				array(),
				array(
					'slug'      => 'give',
					'installed' => false,
				),
			),
		);
	}

	/**
	 * Only a file in the directory itself is the plugin.
	 *
	 * A nested file can carry a plugin header and sort ahead of the real bootstrap by display
	 * name -- this repo's own debug-helper is such a layout, where "Autoloader Debugger" in
	 * modules/ precedes "Jetpack Debug Tools" at the root. Letting one win would report the
	 * wrong id, and active: false for a plugin that is active.
	 */
	public function test_nested_plugin_header_is_not_mistaken_for_the_plugin() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php', true, 'Give' );
		$this->make_plugin( 'give', 'modules/helper.php', true, 'Aardvark Helper' );
		update_option( 'active_plugins', array( 'give/give.php' ) );

		$this->assertSame(
			array(
				'slug'      => 'give',
				'installed' => true,
				'id'        => 'give/give',
				'active'    => true,
			),
			$this->request( 'give' )->get_data()
		);
	}

	/**
	 * Anything but a blog token is refused.
	 *
	 * The exact status is core's to decide: rest_authorization_required_code() answers 401 or
	 * 403 depending on whether the request resolved to a logged-in user, which a user token
	 * does and an unsigned request does not. Only the refusal is ours to promise.
	 *
	 * @param bool|null   $status The authentication status.
	 * @param string|null $type   The token type.
	 * @dataProvider denied_auth_provider
	 */
	#[DataProvider( 'denied_auth_provider' )]
	public function test_request_without_blog_token_is_denied( $status, $type ) {
		$this->set_auth_state( $status, $type );
		$this->make_plugin( 'give', 'give.php' );

		$response = $this->request( 'give' );

		$this->assertTrue( $response->is_error(), 'The request must be refused.' );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Data for test_request_without_blog_token_is_denied.
	 *
	 * @return array
	 */
	public static function denied_auth_provider() {
		return array(
			'unsigned'   => array( null, null ),
			'user token' => array( true, 'user' ),
		);
	}

	/**
	 * Slugs that reach the callback but would resolve to a directory other than a plugin's.
	 * Uppercase gets this far because WP_REST_Server matches routes case-insensitively.
	 *
	 * @param string $slug The slug.
	 * @dataProvider invalid_slug_provider
	 */
	#[DataProvider( 'invalid_slug_provider' )]
	public function test_invalid_slug_is_rejected( $slug ) {
		$this->set_auth_state( true, 'blog' );

		$this->assertSame( 400, $this->request( $slug )->get_status() );
	}

	/**
	 * Data for test_invalid_slug_is_rejected.
	 *
	 * @return array
	 */
	public static function invalid_slug_provider() {
		return array(
			'uppercase'         => array( 'Give' ),
			'current directory' => array( '.' ),
			'parent directory'  => array( '..' ),
		);
	}

	/**
	 * The whole point of the endpoint: no update check, no transient write.
	 */
	public function test_endpoint_has_no_side_effects() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		$transient = (object) array(
			'last_checked' => 1234567890,
			'response'     => array(),
		);
		set_site_transient( 'update_plugins', $transient );

		$requests       = 0;
		$this->http_spy = function () use ( &$requests ) {
			++$requests;
			return new WP_Error( 'no_http', 'Unexpected HTTP request.' );
		};
		add_filter( 'pre_http_request', $this->http_spy );

		$this->assertSame( 200, $this->request( 'give' )->get_status() );
		$this->assertSame( 0, $requests, 'Must not make an HTTP request.' );
		$this->assertEquals( $transient, get_site_transient( 'update_plugins' ), 'Must not refresh update_plugins.' );
	}
}
