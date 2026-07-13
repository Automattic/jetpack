<?php
/**
 * WPCOM_JSON_API_Get_Post_v1_1_Endpoint unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Get_Post_v1_1_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/class.wpcom-json-api-get-post-v1-1-endpoint.php';

/**
 * Tests for the /sites/%s/posts/%d v1.1 get post endpoint.
 *
 * @covers \WPCOM_JSON_API_Get_Post_v1_1_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Get_Post_v1_1_Endpoint::class )]
class WPCOM_JSON_API_Get_Post_v1_1_Endpoint_Test extends WP_UnitTestCase { // phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid, Generic.Classes.OpeningBraceSameLine.ContentAfterBrace -- matches source class naming.
	use WP_UnitTestCase_Fix;

	/**
	 * An admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * The current blog ID.
	 *
	 * @var int
	 */
	private static $blog_id;

	/**
	 * Saved $_SERVER superglobal.
	 *
	 * @var array
	 */
	private $pre_globals;

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'GET';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param WP_UnitTest_Factory $factory A factory object.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$blog_id       = $GLOBALS['blog_id'];
	}

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->pre_globals = $_SERVER;
		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => self::$blog_id );
		wp_set_current_user( self::$admin_user_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		$_SERVER = $this->pre_globals;

		WPCOM_JSON_API::init()->token_details = array();
		WPCOM_JSON_API::init()->query         = array();
		wp_set_current_user( 0 );
	}

	/**
	 * Retrieve the registered v1.1 get-post endpoint instance.
	 *
	 * @return WPCOM_JSON_API_Get_Post_v1_1_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint() {
		$api = WPCOM_JSON_API::init();
		foreach ( $api->endpoints as $endpoints_by_method ) {
			if (
				isset( $endpoints_by_method['GET'] )
				&& get_class( $endpoints_by_method['GET'] ) === 'WPCOM_JSON_API_Get_Post_v1_1_Endpoint'
				&& '1.1' === $endpoints_by_method['GET']->max_version
			) {
				return $endpoints_by_method['GET'];
			}
		}
		$this->fail( 'WPCOM_JSON_API_Get_Post_v1_1_Endpoint (v1.1) not found in registered endpoints.' );
	}

	/**
	 * Helper to create a published post.
	 *
	 * @param array $args Optional overrides for wp_insert_post.
	 * @return int Post ID.
	 */
	private function create_post( $args = array() ) {
		return wp_insert_post(
			array_merge(
				array(
					'post_title'   => 'Test Post',
					'post_content' => 'Test content.',
					'post_status'  => 'publish',
					'post_type'    => 'post',
					'post_author'  => self::$admin_user_id,
				),
				$args
			)
		);
	}

	/**
	 * Test that has_password is true for a password-protected post.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_has_password_is_true_for_password_protected_post() {
		$post_id = $this->create_post( array( 'post_password' => 'secret123' ) );

		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/' . $post_id,
			self::$blog_id,
			$post_id
		);

		$this->assertIsArray( $response );
		$this->assertArrayHasKey( 'has_password', $response );
		$this->assertTrue( $response['has_password'] );
	}

	/**
	 * Test that has_password is false for a post without a password.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_has_password_is_false_for_post_without_password() {
		$post_id = $this->create_post();

		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/' . $post_id,
			self::$blog_id,
			$post_id
		);

		$this->assertIsArray( $response );
		$this->assertArrayHasKey( 'has_password', $response );
		$this->assertFalse( $response['has_password'] );
	}

	/**
	 * A post fetched by ID resolves to that post. The ID arrives as the positional callback
	 * argument, which is how it is delivered over both the REST and XML-RPC transports.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_post_by_id_resolves_to_correct_post() {
		$post_id = $this->create_post( array( 'post_title' => 'Fetched by ID' ) );

		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/' . $post_id,
			self::$blog_id,
			$post_id
		);

		$this->assertIsArray( $response );
		$this->assertSame( $post_id, $response['ID'] );
	}

	/**
	 * A post fetched by slug resolves to the correct post. The slug arrives as the positional
	 * callback argument (the `/posts/slug:` branch), matching how the tokenized REST route and
	 * the XML-RPC path both deliver it.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_post_by_slug_resolves_to_correct_post() {
		$post_id = $this->create_post(
			array(
				'post_title' => 'Fetched by slug',
				'post_name'  => 'a-unique-slug',
			)
		);

		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/slug:a-unique-slug',
			self::$blog_id,
			'a-unique-slug'
		);

		$this->assertIsArray( $response );
		$this->assertSame( $post_id, $response['ID'] );
		$this->assertSame( 'a-unique-slug', $response['slug'] );
	}

	/**
	 * An unknown slug returns an unknown_post error instead of resolving to a post.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_post_by_unknown_slug_returns_error() {
		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/slug:does-not-exist',
			self::$blog_id,
			'does-not-exist'
		);

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unknown_post', $response->get_error_code() );
	}

	/**
	 * The site_ID field must always be serialized as an integer, matching its
	 * documented '(int) The site ID.' contract.
	 *
	 * The render_response_keys() serializer emits site_ID from
	 * $post->site->get_id(). For a Jetpack_Site that returns the request token's
	 * blog_id verbatim, and on create/update requests that value is a string —
	 * so without an explicit (int) cast those endpoints leaked a quoted string
	 * while reads returned a number. We reproduce that condition by giving the
	 * token a string blog_id.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_site_id_is_returned_as_an_integer() {
		$post_id = $this->create_post();

		// Jetpack_Site::get_id() returns $this->platform->token->blog_id; a string
		// value here mirrors the create/update request condition.
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => (string) self::$blog_id );

		$response = $this->get_endpoint()->callback(
			'/sites/' . self::$blog_id . '/posts/' . $post_id,
			self::$blog_id,
			$post_id
		);

		$this->assertIsArray( $response );
		$this->assertArrayHasKey( 'site_ID', $response );
		$this->assertIsInt( $response['site_ID'] );
		$this->assertSame( (int) self::$blog_id, $response['site_ID'] );
	}
}
