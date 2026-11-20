<?php
/**
 * Private Site Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class PrivateSiteTest.
 */
class PrivateSiteTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up test environment before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock the AT_PRIVACY_MODEL constant to simulate private site
		if ( ! defined( 'AT_PRIVACY_MODEL' ) ) {
			define( 'AT_PRIVACY_MODEL', 'wp_uploads' );
		}

		// Define constants if not already defined
		if ( ! defined( 'DAY_IN_SECONDS' ) ) {
			define( 'DAY_IN_SECONDS', 86400 );
		}
		if ( ! defined( 'COOKIEHASH' ) ) {
			define( 'COOKIEHASH', 'test_hash' );
		}
		if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
			define( 'LOGGED_IN_COOKIE', 'wordpress_logged_in_' . COOKIEHASH );
		}
	}

	/**
	 * Test that site_is_private() returns true when AT_PRIVACY_MODEL is set correctly.
	 */
	public function test_site_is_private_returns_true_when_constant_set() {
		$this->assertTrue( \Private_Site\site_is_private() );
	}

	/**
	 * Test get_read_access_cookies with non-existent user.
	 */
	public function test_get_read_access_cookies_with_nonexistent_user() {
		$non_existent_user_id = 99999;

		$result = \Private_Site\get_read_access_cookies( array( $non_existent_user_id, time() + DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that the XML-RPC method is registered correctly.
	 */
	public function test_xmlrpc_method_registration() {
		$methods = array( 'existing.method' => 'some_callback' );

		$result = \Private_Site\register_additional_jetpack_xmlrpc_methods( $methods );

		$this->assertArrayHasKey( 'existing.method', $result );
		$this->assertArrayHasKey( 'jetpack.getClosestThumbnailSizeUrl', $result );
		$this->assertArrayHasKey( 'jetpack.getReadAccessCookies', $result );
		$this->assertEquals( '\Private_Site\get_closest_thumbnail_size_url', $result['jetpack.getClosestThumbnailSizeUrl'] );
		$this->assertEquals( '\Private_Site\get_read_access_cookies', $result['jetpack.getReadAccessCookies'] );
	}

	/**
	 * Test get_closest_thumbnail_size_url with invalid URL.
	 */
	public function test_get_closest_thumbnail_size_url_with_invalid_url() {
		$args = array(
			'url'    => 'https://example.com/nonexistent-image.jpg',
			'width'  => 150,
			'height' => 150,
		);

		$result = \Private_Site\get_closest_thumbnail_size_url( $args );

		$this->assertFalse( $result );
	}

	/**
	 * Test that should_prevent_site_access returns true for unauthenticated users.
	 */
	public function test_should_prevent_site_access_returns_true_for_unauthenticated_users() {
		wp_set_current_user( 0 );

		$this->assertTrue( \Private_Site\should_prevent_site_access() );
	}

	/**
	 * Test that blog_user_can returns false for non-logged-in users.
	 */
	public function test_blog_user_can_returns_false_for_non_logged_in_users() {
		wp_set_current_user( 0 );

		$this->assertFalse( \Private_Site\blog_user_can( 'read' ) );
	}

	/**
	 * Test that is_private_blog_user returns false for non-authenticated users.
	 */
	public function test_is_private_blog_user_returns_false_for_non_authenticated_users() {
		wp_set_current_user( 0 );

		$this->assertFalse( \Private_Site\is_private_blog_user() );
	}

	/**
	 * Content endpoints remain denied for unauthenticated visitors.
	 */
	public function test_rest_dispatch_request_denies_content_endpoints() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_dispatch_request( null, new WP_REST_Request( 'GET', '/wp/v2/posts' ), '/wp/v2/posts' );

		$this->assertWPError( $result );
		$this->assertSame( 'private_site', $result->get_error_code() );
	}

	/**
	 * The index has no carve-out at dispatch: anything reaching it unauthenticated is denied.
	 */
	public function test_rest_dispatch_request_denies_the_index_route() {
		wp_set_current_user( 0 );

		foreach ( array( 'GET', 'POST' ) as $method ) {
			$result = \Private_Site\rest_dispatch_request( null, new WP_REST_Request( $method, '/' ), '/' );

			$this->assertWPError( $result, $method );
			$this->assertSame( 'private_site', $result->get_error_code(), $method );
		}
	}

	/**
	 * The batch endpoint is not the index and stays denied.
	 */
	public function test_rest_dispatch_request_denies_the_batch_endpoint() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_dispatch_request( null, new WP_REST_Request( 'GET', '/batch/v1' ), '/batch/v1' );

		$this->assertWPError( $result );
		$this->assertSame( 'private_site', $result->get_error_code() );
	}

	/**
	 * A dispatch result from another plugin is left untouched.
	 */
	public function test_rest_dispatch_request_preserves_a_prior_dispatch_result() {
		wp_set_current_user( 0 );

		$prior  = new WP_REST_Response( 'handled elsewhere' );
		$result = \Private_Site\rest_dispatch_request( $prior, new WP_REST_Request( 'GET', '/wp/v2/posts' ), '/wp/v2/posts' );

		$this->assertSame( $prior, $result );
	}

	/**
	 * Unauthenticated GET and HEAD of the index are both answered with the minimal index.
	 *
	 * @dataProvider provide_index_read_methods
	 *
	 * @param string $method HTTP method.
	 */
	#[DataProvider( 'provide_index_read_methods' )]
	public function test_reading_the_index_returns_the_minimal_index( $method ) {
		wp_set_current_user( 0 );

		$response = $this->dispatch_index( $method );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Private Site', $data['name'] );
		$this->assertSame( array(), $data['namespaces'] );
		$this->assertEquals( new \stdClass(), $data['routes'] );
	}

	/**
	 * HTTP methods that read the index.
	 *
	 * @return array
	 */
	public static function provide_index_read_methods() {
		return array(
			'GET'  => array( 'GET' ),
			'HEAD' => array( 'HEAD' ),
		);
	}

	/**
	 * Logged-out responses are edge-cacheable unless marked otherwise, which would outlive a launch.
	 */
	public function test_minimal_index_is_not_cacheable() {
		wp_set_current_user( 0 );

		$headers = $this->dispatch_index()->get_headers();

		$this->assertArrayHasKey( 'Cache-Control', $headers );
		$this->assertStringContainsString( 'no-store', $headers['Cache-Control'] );
	}

	/**
	 * The `rest_index` chain starts from an empty seed, so core's full index (and `?context=help`
	 * route schemas) is never built for an anonymous visitor.
	 */
	public function test_minimal_index_does_not_build_the_core_index() {
		wp_set_current_user( 0 );
		$seen = array(
			'namespaces' => null,
			'routes'     => null,
		);
		add_filter(
			'rest_index',
			function ( $response ) use ( &$seen ) {
				$seen = $response->get_data();
				return $response;
			},
			1
		);

		$this->dispatch_index( 'GET', array( 'context' => 'help' ) );

		$this->assertSame( array(), $seen['namespaces'] );
		$this->assertSame( array(), $seen['routes'] );
	}

	/**
	 * A filter running after everyone else can't add to the served index, and can write to the
	 * seed's maps as arrays without fataling.
	 */
	public function test_minimal_index_ignores_additions_from_later_filters() {
		wp_set_current_user( 0 );
		add_filter(
			'rest_index',
			function ( $response ) {
				$response->data['routes']['/secret-plugin/v1'] = array( 'namespace' => 'secret-plugin/v1' );
				$response->data['namespaces'][]                = 'secret-plugin/v1';
				$response->data['timezone_string']             = 'America/New_York';
				return $response;
			},
			PHP_INT_MAX
		);

		$data = $this->dispatch_index()->get_data();

		$this->assertEquals( new \stdClass(), $data['routes'] );
		$this->assertSame( array(), $data['namespaces'] );
		$this->assertArrayNotHasKey( 'timezone_string', $data );
	}

	/**
	 * Only reads of the index are short-circuited; writes fall through to normal routing.
	 */
	public function test_rest_pre_dispatch_ignores_writes_to_the_index() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_pre_dispatch( null, rest_get_server(), new WP_REST_Request( 'POST', '/' ) );

		$this->assertNull( $result );
	}

	/**
	 * Only the index is short-circuited; other routes fall through to `rest_dispatch_request()`.
	 */
	public function test_rest_pre_dispatch_ignores_other_routes() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_pre_dispatch( null, rest_get_server(), new WP_REST_Request( 'GET', '/wp/v2/posts' ) );

		$this->assertNull( $result );
	}

	/**
	 * A pre-dispatch result from another plugin is left untouched.
	 */
	public function test_rest_pre_dispatch_preserves_a_prior_result() {
		wp_set_current_user( 0 );

		$prior  = new WP_REST_Response( 'handled elsewhere' );
		$result = \Private_Site\rest_pre_dispatch( $prior, rest_get_server(), new WP_REST_Request( 'GET', '/' ) );

		$this->assertSame( $prior, $result );
	}

	/**
	 * Members get core's full, unmodified index. Runs in its own process because
	 * `should_prevent_site_access()` caches its first answer.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_members_get_the_full_index() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$response = $this->dispatch_index();
		$data     = $response->get_data();

		$this->assertContains( 'wp/v2', $data['namespaces'] );
		$this->assertNotEmpty( (array) $data['routes'] );
		$this->assertArrayNotHasKey( 'Cache-Control', $response->get_headers() );
	}

	/**
	 * The trimmed index exposes only the allowlisted keys; everything else is withheld.
	 */
	public function test_build_minimal_rest_index_returns_only_allowlisted_keys() {
		wp_set_current_user( 0 );

		$result = \Private_Site\build_minimal_rest_index( $this->full_rest_index_response() );
		$data   = $result->get_data();

		$this->assertSame(
			array( 'name', 'description', 'url', 'home', 'gmt_offset', 'namespaces', 'authentication', 'routes' ),
			array_keys( $data )
		);
		$this->assertSame( '', $data['description'] );
		$this->assertSame( 0, $data['gmt_offset'] );
		$this->assertSame( array(), $data['namespaces'] );
		$this->assertEquals( new \stdClass(), $data['routes'], 'routes is a map: empty must be {} (an object), not []' );
		// _links (help, active-theme) must not survive the trim.
		$this->assertSame( array(), $result->get_links() );
	}

	/**
	 * The authentication block is the payload clients need, so it is copied through verbatim.
	 */
	public function test_build_minimal_rest_index_preserves_the_authentication_block() {
		wp_set_current_user( 0 );

		$response = $this->full_rest_index_response();
		$expected = $response->get_data()['authentication'];

		$data = \Private_Site\build_minimal_rest_index( $response )->get_data();

		$this->assertSame( $expected, $data['authentication'] );
	}

	/**
	 * `authentication` is a map, so an empty one (no SSL, no auth plugins) must still serialize as an object.
	 */
	public function test_build_minimal_rest_index_serializes_empty_authentication_as_an_object() {
		wp_set_current_user( 0 );
		$response = new WP_REST_Response( array( 'authentication' => array() ) );

		$auth = \Private_Site\build_minimal_rest_index( $response )->get_data()['authentication'];

		$this->assertEquals( new \stdClass(), $auth, 'empty authentication must be {} (an object), not []' );
	}

	/**
	 * The Application Passwords authorization URL -- the reason the index is exposed -- survives the trim.
	 */
	public function test_minimal_index_keeps_the_application_passwords_authorization_url() {
		wp_set_current_user( 0 );
		// Atomic sites have SSL, so core advertises Application Passwords; force that in the test env.
		add_filter( 'wp_is_application_passwords_available', '__return_true' );
		// The suite's hook backup can leave core's rest_api_init hook detached by the time this runs.
		add_filter( 'rest_index', 'rest_add_application_passwords_to_index' );

		$data = $this->dispatch_index()->get_data();

		$this->assertStringContainsString(
			'authorize-application.php',
			$data['authentication']['application-passwords']['endpoints']['authorization']
		);
	}

	/**
	 * A third-party auth plugin that adds its method under `authentication` is kept alongside core's.
	 */
	public function test_minimal_index_preserves_other_plugins_authentication_methods() {
		wp_set_current_user( 0 );
		add_filter( 'wp_is_application_passwords_available', '__return_true' );
		add_filter( 'rest_index', 'rest_add_application_passwords_to_index' );
		add_filter(
			'rest_index',
			function ( $response ) {
				$response->data['authentication']['acme-oauth'] = array(
					'endpoints' => array( 'authorization' => 'https://example.com/acme/authorize' ),
				);
				return $response;
			},
			20
		);

		$auth = $this->dispatch_index()->get_data()['authentication'];

		$this->assertArrayHasKey( 'application-passwords', $auth );
		$this->assertArrayHasKey( 'acme-oauth', $auth );
	}

	/**
	 * The index name is routed through the site-name mask rather than the raw option.
	 */
	public function test_build_minimal_rest_index_masks_the_site_name() {
		wp_set_current_user( 0 );
		update_option( 'blogname', 'Secret Site Name' );
		add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

		$data = \Private_Site\build_minimal_rest_index( $this->full_rest_index_response() )->get_data();

		$this->assertSame( 'Private Site', $data['name'] );
	}

	/**
	 * Coming-soon sites show their real name on the HTML page, and the index matches it.
	 */
	public function test_build_minimal_rest_index_shows_the_real_name_on_coming_soon_sites() {
		wp_set_current_user( 0 );
		update_option( 'blogname', 'Launching Soon' );
		add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );
		wp_cache_set( 'wpcom_coming_soon', 1, 'wpcomsh' );

		$data = \Private_Site\build_minimal_rest_index( $this->full_rest_index_response() )->get_data();
		wp_cache_delete( 'wpcom_coming_soon', 'wpcomsh' );

		$this->assertSame( 'Launching Soon', $data['name'] );
	}

	/**
	 * Every access-denied page, including the one the apps get, advertises the REST API root.
	 *
	 * @dataProvider provide_access_denied_templates
	 *
	 * @param string $template Template file name.
	 */
	#[DataProvider( 'provide_access_denied_templates' )]
	public function test_access_denied_templates_print_the_rest_api_discovery_link( $template ) {
		wp_set_current_user( 0 );
		$_SERVER['SERVER_NAME'] = 'example.org';
		$_SERVER['REQUEST_URI'] = '/';
		// Only the <head> matters here; the footer pulls in unrelated deprecated core callbacks.
		remove_all_actions( 'wp_footer' );
		// The test bootstrap has already printed output, so the templates' header() calls can only warn.
		set_error_handler(
			static function ( $errno, $errstr ) {
				return 0 === strpos( $errstr, 'Cannot modify header information' );
			},
			E_WARNING
		);

		$html = '';
		try {
			ob_start();
			require dirname( __DIR__ ) . '/private-site/' . $template;
			$html = (string) ob_get_clean();
		} finally {
			restore_error_handler();
		}

		$this->assertStringContainsString( '<link rel="https://api.w.org/" href="' . esc_url( get_rest_url() ) . '" />', $html );
	}

	/**
	 * The three access-denied templates.
	 *
	 * @return array
	 */
	public static function provide_access_denied_templates() {
		return array(
			'private site' => array( 'access-denied-private-site-template.php' ),
			'coming soon'  => array( 'access-denied-coming-soon-template.php' ),
			'app preview'  => array( 'access-denied-preview-login-template.php' ),
		);
	}

	/**
	 * Dispatches a request for the REST index with the private-site hooks added as `init()` does.
	 *
	 * @param string $method HTTP method.
	 * @param array  $params Query parameters.
	 * @return WP_REST_Response
	 */
	private function dispatch_index( $method = 'GET', $params = array() ) {
		add_filter( 'rest_pre_dispatch', '\Private_Site\rest_pre_dispatch', 10, 3 );
		add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

		$request = new WP_REST_Request( $method, '/' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Builds a response shaped like core's full REST index, including fields a private site must not leak.
	 *
	 * @return WP_REST_Response
	 */
	private function full_rest_index_response() {
		$response = new WP_REST_Response(
			array(
				'name'            => 'Secret Site Name',
				'description'     => 'Secret tagline',
				'url'             => 'https://example.com',
				'home'            => 'https://example.com',
				'gmt_offset'      => '5',
				'timezone_string' => 'America/New_York',
				'namespaces'      => array( 'wp/v2', 'secret-plugin/v1' ),
				'authentication'  => array(
					'application-passwords' => array(
						'endpoints' => array(
							'authorization' => 'https://example.com/wp-admin/authorize-application.php',
						),
					),
				),
				'site_icon'       => 42,
				'routes'          => array(
					'/secret-plugin/v1/secrets' => array( 'namespace' => 'secret-plugin/v1' ),
				),
			)
		);
		$response->add_link( 'help', 'https://developer.wordpress.org/rest-api/' );

		return $response;
	}
}
