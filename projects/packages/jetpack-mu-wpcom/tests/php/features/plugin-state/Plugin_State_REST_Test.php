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
require_once __DIR__ . '/stub-is-plugin-active.php';

/**
 * Tests for the Atomic plugin-state REST route.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State\Plugin_State_REST_Controller
 */
#[CoversClass( Plugin_State_REST_Controller::class )]
class Plugin_State_REST_Test extends \WorDBless\BaseTestCase {

	const ROUTE = '/wpcom/v2/plugin-state/(?P<plugin_slug>[a-z0-9_.-]+)';

	/**
	 * Plugin directories created by a test, to be removed afterwards.
	 *
	 * @var string[]
	 */
	private $created_dirs = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();

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

		$this->forget_discovered_plugins();
		$this->set_auth_state( null, null );

		unset( $GLOBALS['plugin_state_test_active_plugins'], $GLOBALS['plugin_state_test_asked_about'] );

		remove_action( 'rest_api_init', array( $this, 'register_route' ) );

		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Register the route under test.
	 */
	public function register_route() {
		( new Plugin_State_REST_Controller() )->register_routes();
	}

	/**
	 * Drive Rest_Authentication's view of how the current request was signed.
	 *
	 * The properties are private and there is no setter, so reflection is the seam. Passing
	 * ( true, 'blog' ) is what a blog-token-signed request leaves behind, ( true, 'user' ) a
	 * user-token one, and ( null, null ) an unsigned one.
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
	 * Create a plugin directory, optionally with a file carrying a plugin header.
	 *
	 * @param string      $dir_name The directory name under WP_PLUGIN_DIR.
	 * @param string|null $file     File to create inside it, or null for an empty directory.
	 * @param string      $name     The plugin's display name.
	 */
	private function make_plugin( $dir_name, $file = null, $name = 'Test Plugin' ) {
		$dir = WP_PLUGIN_DIR . '/' . $dir_name;
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0777, true );
		}
		$this->created_dirs[] = $dir;

		if ( null !== $file ) {
			file_put_contents(
				$dir . '/' . $file,
				"<?php\n/*\n * Plugin Name: $name\n * Version: 1.0\n */\n"
			);
		}

		$this->forget_discovered_plugins();
	}

	/**
	 * Drop the per-directory scan that get_plugins() memoises, so that plugin files a test
	 * adds to or removes from disk are actually seen.
	 */
	private function forget_discovered_plugins() {
		wp_cache_delete( 'plugins', 'plugins' );
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
	 * Dispatch a request for a slug as WordPress.com would, blog-token signed by default.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return WP_REST_Response
	 */
	private function request( $slug ) {
		return rest_do_request( new WP_REST_Request( Requests::GET, '/wpcom/v2/plugin-state/' . $slug ) );
	}

	/**
	 * The route is registered when the feature is loaded.
	 */
	public function test_route_is_registered() {
		$this->assertArrayHasKey( self::ROUTE, rest_get_server()->get_routes() );
	}

	/**
	 * The feature is gated to Atomic. Jetpack_Mu_Wpcom::init() ran from the test bootstrap
	 * without IS_ATOMIC, so the loader must not have been hooked.
	 */
	public function test_feature_is_not_loaded_outside_atomic() {
		$this->assertFalse( defined( 'IS_ATOMIC' ) && IS_ATOMIC );
		$this->assertFalse(
			has_action( 'plugins_loaded', array( Jetpack_Mu_Wpcom::class, 'load_plugin_state' ) )
		);
	}

	/**
	 * A blog-token-signed request is served.
	 */
	public function test_blog_token_request_is_allowed() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		$this->assertSame( 200, $this->request( 'give' )->get_status() );
	}

	/**
	 * An unsigned request is refused.
	 */
	public function test_unsigned_request_is_denied() {
		$this->set_auth_state( null, null );
		$this->make_plugin( 'give', 'give.php' );

		$response = $this->request( 'give' );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * A user-token-signed request is refused: this route is service-to-site only.
	 */
	public function test_user_token_request_is_denied() {
		$this->set_auth_state( true, 'user' );
		$this->make_plugin( 'give', 'give.php' );

		$response = $this->request( 'give' );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * An active plugin reports active, and its id drops the .php suffix.
	 */
	public function test_active_plugin() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );
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
	 * A network-activated plugin counts as active.
	 *
	 * Network activation never appears in `active_plugins`; core folds it in via
	 * is_plugin_active_for_network(). So what the controller has to get right is to put the
	 * question to core about the canonical plugin file and report the answer, rather than
	 * reading the option itself. That is what is pinned down here -- core's own network
	 * branch is stood in for, because this suite cannot run as multisite (see
	 * stub-is-plugin-active.php).
	 */
	public function test_network_active_plugin() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		// Network activation is invisible to `active_plugins`, so leave it empty.
		update_option( 'active_plugins', array() );
		$GLOBALS['plugin_state_test_active_plugins'] = array( 'give/give.php' );
		$GLOBALS['plugin_state_test_asked_about']    = array();

		$data = $this->request( 'give' )->get_data();

		$this->assertTrue( $data['active'], 'A network-activated plugin must report as active.' );
		$this->assertSame(
			array( 'give/give.php' ),
			$GLOBALS['plugin_state_test_asked_about'],
			'Activity must be settled by core, asked about the canonical plugin file.'
		);
	}

	/**
	 * An installed but inactive plugin reports installed with active false.
	 */
	public function test_inactive_plugin() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );
		update_option( 'active_plugins', array() );

		$this->assertSame(
			array(
				'slug'      => 'give',
				'installed' => true,
				'id'        => 'give/give',
				'active'    => false,
			),
			$this->request( 'give' )->get_data()
		);
	}

	/**
	 * A plugin that is not on disk is a 200 reporting installed false, not an error.
	 */
	public function test_missing_plugin_is_a_successful_state() {
		$this->set_auth_state( true, 'blog' );

		$response = $this->request( 'not-installed' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'slug'      => 'not-installed',
				'installed' => false,
			),
			$response->get_data()
		);
	}

	/**
	 * A directory with no plugin header in it is not an installed plugin.
	 */
	public function test_directory_without_plugin_header_is_not_installed() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'empty-dir', null );

		$response = $this->request( 'empty-dir' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'slug'      => 'empty-dir',
				'installed' => false,
			),
			$response->get_data()
		);
	}

	/**
	 * The canonical id is the plugin file without its extension, even when the file is not
	 * named after the directory.
	 */
	public function test_canonical_id_conversion() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'advanced-ads', 'advanced-ads.php' );
		$this->make_plugin( 'oddly-named', 'main-file.php' );

		$this->assertSame( 'advanced-ads/advanced-ads', $this->request( 'advanced-ads' )->get_data()['id'] );
		$this->assertSame( 'oddly-named/main-file', $this->request( 'oddly-named' )->get_data()['id'] );
	}

	/**
	 * Slugs that reach the callback but are not valid directory slugs are rejected with a 400.
	 *
	 * Uppercase gets this far because WP_REST_Server matches routes case-insensitively; `.`
	 * and `..` because they are spelled with characters the route pattern allows.
	 *
	 * @param string $slug The slug to reject.
	 * @dataProvider invalid_slug_provider
	 */
	#[DataProvider( 'invalid_slug_provider' )]
	public function test_invalid_slug_is_rejected( $slug ) {
		$this->set_auth_state( true, 'blog' );

		$response = $this->request( $slug );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Slugs rejected by the route pattern itself.
	 *
	 * @return array<string, array{string}>
	 */
	public static function invalid_slug_provider() {
		return array(
			'uppercase'         => array( 'Give' ),
			'mixed case'        => array( 'giVe' ),
			'current directory' => array( '.' ),
			'parent directory'  => array( '..' ),
		);
	}

	/**
	 * A slug that merely contains dots is not a traversal attempt: only the `.` and `..`
	 * segments themselves are. Anything else is an ordinary slug that happens to be absent.
	 */
	public function test_dotted_slug_is_treated_as_an_ordinary_slug() {
		$this->set_auth_state( true, 'blog' );

		$response = $this->request( '..-..' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['installed'] );
	}

	/**
	 * Slugs carrying a separator or an unsupported character never match the route, so the
	 * request stops at the router with a 404 rather than reaching the callback.
	 *
	 * @param string $slug The slug to reject.
	 * @dataProvider unroutable_slug_provider
	 */
	#[DataProvider( 'unroutable_slug_provider' )]
	public function test_unroutable_slug_is_not_dispatched( $slug ) {
		$this->set_auth_state( true, 'blog' );

		$response = $this->request( $slug );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_no_route', $response->get_data()['code'] );
	}

	/**
	 * Slugs that cannot be routed at all.
	 *
	 * @return array<string, array{string}>
	 */
	public static function unroutable_slug_provider() {
		return array(
			'plugin file id'       => array( 'give/give.php' ),
			'forward slash'        => array( 'give/give' ),
			'traversal with slash' => array( '../../wp-config' ),
			'backslash'            => array( 'give\\give' ),
			'unsupported char'     => array( 'give$' ),
			'space'                => array( 'give plugin' ),
		);
	}

	/**
	 * The endpoint makes no outbound HTTP request -- in particular, no wordpress.org
	 * update check.
	 */
	public function test_no_http_request_is_made() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		$requests = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$requests ) {
				++$requests;
				return new WP_Error( 'no_http_in_tests', 'Unexpected HTTP request.' );
			}
		);

		$this->assertSame( 200, $this->request( 'give' )->get_status() );
		$this->assertSame( 0, $requests, 'The plugin-state route must not make an HTTP request.' );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * The endpoint does not refresh the update_plugins transient.
	 */
	public function test_update_plugins_transient_is_untouched() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		$before = (object) array(
			'last_checked' => 1234567890,
			'response'     => array(),
		);
		set_site_transient( 'update_plugins', $before );

		$this->request( 'give' );

		$this->assertEquals( $before, get_site_transient( 'update_plugins' ) );
	}

	/**
	 * The response carries the documented fields and nothing else -- no filesystem paths,
	 * no plugin metadata.
	 */
	public function test_response_contains_only_documented_fields() {
		$this->set_auth_state( true, 'blog' );
		$this->make_plugin( 'give', 'give.php' );

		$this->assertSame(
			array( 'slug', 'installed', 'id', 'active' ),
			array_keys( $this->request( 'give' )->get_data() )
		);

		$this->assertSame(
			array( 'slug', 'installed' ),
			array_keys( $this->request( 'absent' )->get_data() )
		);
	}
}
