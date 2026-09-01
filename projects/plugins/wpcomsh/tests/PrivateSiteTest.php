<?php
/**
 * Private Site Test file.
 *
 * @package wpcomsh
 */

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
	 * The REST index is readable so unauthenticated clients can discover how to authenticate.
	 */
	public function test_rest_dispatch_request_allows_reading_the_index() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_dispatch_request( null, new WP_REST_Request( 'GET', '/' ), '/' );

		$this->assertNull( $result );
	}

	/**
	 * Only reads of the index are allowed; writes to it are still denied.
	 */
	public function test_rest_dispatch_request_denies_writing_the_index() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_dispatch_request( null, new WP_REST_Request( 'POST', '/' ), '/' );

		$this->assertWPError( $result );
		$this->assertSame( 'private_site', $result->get_error_code() );
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
	 * The trimmed index exposes only the allowlisted keys; everything else is withheld.
	 */
	public function test_rest_index_returns_only_allowlisted_keys() {
		wp_set_current_user( 0 );

		$result = \Private_Site\rest_index( $this->full_rest_index_response() );
		$data   = $result->get_data();

		$this->assertSame(
			array( 'name', 'description', 'url', 'home', 'gmt_offset', 'namespaces', 'authentication', 'routes' ),
			array_keys( $data )
		);
		$this->assertSame( '', $data['description'] );
		$this->assertSame( 0, $data['gmt_offset'] );
		$this->assertSame( array(), $data['namespaces'] );
		$this->assertSame( array(), $data['routes'] );
		// The raw site name and _links (help, active-theme) must not survive the trim.
		$this->assertNotSame( 'Secret Site Name', $data['name'] );
		$this->assertSame( array(), $result->get_links() );
	}

	/**
	 * The authentication block is the payload clients need, so it is copied through verbatim.
	 */
	public function test_rest_index_preserves_the_authentication_block() {
		wp_set_current_user( 0 );

		$response = $this->full_rest_index_response();
		$expected = $response->get_data()['authentication'];

		$data = \Private_Site\rest_index( $response )->get_data();

		$this->assertSame( $expected, $data['authentication'] );
		$this->assertArrayHasKey( 'application-passwords', $data['authentication'] );
	}

	/**
	 * End-to-end: the Application Passwords authorization URL — the whole point of exposing the
	 * index — survives the trim. This only holds because the filter runs after core populates
	 * `authentication` (both hook `rest_index`, ours at PHP_INT_MAX); a lower priority would drop it.
	 */
	public function test_rest_index_keeps_the_application_passwords_authorization_url() {
		wp_set_current_user( 0 );
		// Atomic sites have SSL, so core advertises Application Passwords; force that in the test env.
		add_filter( 'wp_is_application_passwords_available', '__return_true' );
		// Core hooks this on rest_api_init; re-add it explicitly since the suite's hook backup +
		// the REST-server singleton can leave it detached by the time this test runs.
		add_filter( 'rest_index', 'rest_add_application_passwords_to_index' );
		// Register the filter exactly as init() does on a live private site.
		add_filter( 'rest_index', '\Private_Site\rest_index', PHP_INT_MAX );

		$data = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/' ) )->get_data();

		remove_filter( 'rest_index', '\Private_Site\rest_index', PHP_INT_MAX );
		remove_filter( 'rest_index', 'rest_add_application_passwords_to_index' );
		remove_filter( 'wp_is_application_passwords_available', '__return_true' );

		$this->assertArrayHasKey( 'application-passwords', $data['authentication'] );
		$this->assertStringContainsString(
			'authorize-application.php',
			$data['authentication']['application-passwords']['endpoints']['authorization']
		);
		$this->assertSame( array(), $data['routes'], 'the index is still stripped for unauthenticated visitors' );
	}

	/**
	 * Running last (PHP_INT_MAX) means we snapshot every provider's contribution, so a third-party
	 * auth plugin that follows core's convention -- adding its method under `authentication` -- is
	 * kept alongside core's Application Passwords rather than clobbered.
	 */
	public function test_rest_index_preserves_other_plugins_authentication_methods() {
		wp_set_current_user( 0 );
		add_filter( 'wp_is_application_passwords_available', '__return_true' );
		add_filter( 'rest_index', 'rest_add_application_passwords_to_index' );
		// A third-party auth plugin registering at a normal priority, i.e. before ours.
		$acme = function ( $response ) {
			$response->data['authentication']['acme-oauth'] = array(
				'endpoints' => array( 'authorization' => 'https://example.com/acme/authorize' ),
			);
			return $response;
		};
		add_filter( 'rest_index', $acme, 20 );
		add_filter( 'rest_index', '\Private_Site\rest_index', PHP_INT_MAX );

		$auth = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/' ) )->get_data()['authentication'];

		remove_filter( 'rest_index', '\Private_Site\rest_index', PHP_INT_MAX );
		remove_filter( 'rest_index', $acme, 20 );
		remove_filter( 'rest_index', 'rest_add_application_passwords_to_index' );
		remove_filter( 'wp_is_application_passwords_available', '__return_true' );

		$this->assertArrayHasKey( 'application-passwords', $auth );
		$this->assertArrayHasKey( 'acme-oauth', $auth );
	}

	/**
	 * The index name is routed through the site-name mask rather than the raw option.
	 */
	public function test_rest_index_masks_the_site_name() {
		wp_set_current_user( 0 );
		update_option( 'blogname', 'Secret Site Name' );
		add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

		$data = \Private_Site\rest_index( $this->full_rest_index_response() )->get_data();

		$this->assertSame( 'Private Site', $data['name'] );

		remove_filter( 'bloginfo', '\Private_Site\mask_site_name', 3 );
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
