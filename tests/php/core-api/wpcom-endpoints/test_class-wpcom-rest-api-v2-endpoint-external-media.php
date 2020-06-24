<?php // phpcs:ignore
/**
 * Tests for /wpcom/v2/external-media endpoints.
 */

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Class WP_Test_WPCOM_REST_API_V2_Endpoint_External_Media
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_External_Media
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_External_Media extends WP_Test_Jetpack_REST_Testcase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Name of test image.
	 *
	 * @var string
	 */
	private $image_name = 'example_image';

	/**
	 * Path to test image.
	 *
	 * @var string
	 */
	private static $image_path;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id    = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$image_path = dirname( dirname( __DIR__ ) ) . '/files/jetpack.jpg';
	}

	/**
	 * Setup the environment for a test.
	 */
	public function setUp() {
		parent::setUp();

		wp_set_current_user( static::$user_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tearDown() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		parent::tearDown();
	}

	/**
	 * Tests empty list response.
	 */
	public function test_list_pexels_empty() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_pexels' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/list/pexels' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertObjectHasAttribute( 'found', $data );
		$this->assertObjectHasAttribute( 'media', $data );
		$this->assertObjectHasAttribute( 'meta', $data );
		$this->assertObjectHasAttribute( 'next_page', $data->meta );
		$this->assertEmpty( $data->media );

		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_pexels' ) );
	}

	/**
	 * Tests list response with unauthenticated Google Photos.
	 */
	public function test_list_google_photos_unauthenticated() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_google_photos_unauthenticated' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/list/google_photos' );
		$response = $this->server->dispatch( $request );
		$error    = $response->get_data();

		$this->assertObjectHasAttribute( 'code', $error );
		$this->assertObjectHasAttribute( 'message', $error );
		$this->assertObjectHasAttribute( 'data', $error );
		$this->assertEquals( 'authorization_required', $error->code );
		$this->assertEquals( 403, $error->data->status );

		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_google_photos_unauthenticated' ) );
	}

	/**
	 * Tests list response with unauthenticated Google Photos.
	 */
	public function test_copy_image() {
		$tmp_name = $this->get_temp_name( static::$image_path );
		if ( file_exists( $tmp_name ) ) {
			unlink( $tmp_name );
		}

		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );
		add_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'media' => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => static::$image_path,
								'name' => $this->image_name,
							)
						),
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data()[0];

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );
		remove_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		remove_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'caption', $data );
		$this->assertArrayHasKey( 'alt', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'url', $data );
		$this->assertEquals( 'image', $data['type'] );
		$this->assertInternalType( 'int', $data['id'] );
		$this->assertEmpty( $data['caption'] );
		$this->assertEmpty( $data['alt'] );
	}

	/**
	 * Tests connection response for Google Photos.
	 */
	public function test_connection_google_photos() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_connection_google_photos' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/connection/google_photos' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'google_photos', $data->ID );
		$this->assertNotEmpty( $data->connect_URL ); // phpcs:ignore

		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_connection_google_photos' ) );
	}

	/**
	 * Mock the user token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_id => 'pretend_this_is_valid.secret.' . static::$user_id,
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for Pexels and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_pexels( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/meta/external-media/pexels', $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"found":0,"media":[],"meta":{"next_page":false}}',
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_google_photos_unauthenticated( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/meta/external-media/google_photos', $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"code":"authorization_required","message":"You are not connected to that service.","data":{"status":403}}',
			'status'   => 403,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "copy" Jetpack API request for Pexels and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_image_data( $response, $args, $url ) {
		$this->assertEquals( static::$image_path, $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "connection" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_connection_google_photos( $response, $args, $url ) {
		$this->assertEquals( WP_REST_Server::READABLE, $args['method'] );
		$this->assertEquals( 'https://public-api.wordpress.com/wpcom/v2/meta/external-media/connection/google_photos', $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"ID":"google_photos","label":"Google Photos","type":"other","description":"Access photos in your Google Account for use in posts and pages","genericon":{"class":"googleplus-alt","unicode":"\\f218"},"icon":"http:\/\/i.wordpress.com\/wp-content\/lib\/external-media-service\/icon\/google-photos-2x.png","connect_URL":"https:\/\/public-api.wordpress.com\/connect\/?action=request&kr_nonce=0&nonce=0&for=connect&service=google_photos&kr_blog_nonce=0&magic=keyring&blog=0","multiple_external_user_ID_support":false,"external_users_only":false,"jetpack_support":true}',
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Re-creates a temporary file name so we can clean up after ourselves.
	 *
	 * @param string $filename File name.
	 * @param string $dir      Temp directory. Dafault empty.
	 *
	 * @return string|string[]|null
	 */
	public function get_temp_name( $filename, $dir = '' ) {
		if ( empty( $dir ) ) {
			$dir = get_temp_dir();
		}

		if ( empty( $filename ) || in_array( $filename, array( '.', '/', '\\' ), true ) ) {
			$filename = uniqid();
		}

		// Use the basename of the given file without the extension as the name for the temporary directory.
		$temp_filename = basename( $filename );
		$temp_filename = preg_replace( '|\.[^.]*$|', '', $temp_filename );

		// If the folder is falsey, use its parent directory name instead.
		if ( ! $temp_filename ) {
			return wp_tempnam( dirname( $filename ), $dir );
		}

		// Suffix some random data to avoid filename conflicts.
		$temp_filename .= '-' . wp_generate_password( 6, false );
		$temp_filename .= '.tmp';

		add_filter( 'wp_unique_filename', array( $this, 'get_file_name' ) );
		$temp_filename = $dir . wp_unique_filename( $dir, $temp_filename );
		remove_filter( 'wp_unique_filename', array( $this, 'get_file_name' ) );

		return $temp_filename;
	}

	/**
	 * Filter callback to provide a similar file name as in tested class.
	 *
	 * @see WPCOM_REST_API_V2_Endpoint_External_Media::tmp_name()
	 *
	 * @return string
	 */
	public function get_file_name() {
		return $this->image_name;
	}

	/**
	 * Copies file contents into temp file.
	 *
	 * @param array $file File information.
	 * @return mixed
	 */
	public function copy_image( $file ) {
		copy( static::$image_path, $file['tmp_name'] );

		return $file;
	}

	/**
	 * Returns an array of allowed image extensions.
	 *
	 * @return array
	 */
	public function mock_extensions() {
		return array(
			'ext'             => 'jpg',
			'type'            => 'image/jpeg',
			'proper_filename' => basename( static::$image_path ),
		);
	}
}
