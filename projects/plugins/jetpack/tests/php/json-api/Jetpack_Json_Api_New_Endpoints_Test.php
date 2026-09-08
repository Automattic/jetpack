<?php
/**
 * Tests for the plugins/new and themes/new JSON API endpoints.
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for the plugins/new and themes/new JSON API endpoints.
 *
 * @covers \Jetpack_JSON_API_Plugins_New_Endpoint
 * @covers \Jetpack_JSON_API_Themes_New_Endpoint
 */
#[CoversClass( Jetpack_JSON_API_Plugins_New_Endpoint::class )]
#[CoversClass( Jetpack_JSON_API_Themes_New_Endpoint::class )]
class Jetpack_Json_Api_New_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A user without install_plugins / install_themes.
	 *
	 * @var int
	 */
	private static $author_id;

	/**
	 * The victim whose attachment must survive.
	 *
	 * @var int
	 */
	private static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
		wp_set_current_user( self::$author_id );
	}

	/**
	 * Invoke the protected validate_call() method directly, so the
	 * capability-failure cleanup path can be exercised without bootstrapping
	 * the full API dispatcher.
	 *
	 * @param object $endpoint   Endpoint instance.
	 * @param string $capability Capability to pass to validate_call.
	 * @return bool|WP_Error
	 */
	private function invoke_validate_call( $endpoint, $capability ) {
		$class  = new ReflectionClass( $endpoint );
		$method = $class->getMethod( 'validate_call' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $endpoint, 0, $capability, true );
	}

	private function create_attachment( $author_id ) {
		return self::factory()->attachment->create_object(
			array(
				'file'           => 'test-package.zip',
				'post_parent'    => 0,
				'post_mime_type' => 'application/zip',
				'post_type'      => 'attachment',
				'post_author'    => $author_id,
			)
		);
	}

	private function endpoint_args() {
		return array(
			'description'    => '',
			'group'          => '__do_not_document',
			'stat'           => 'test',
			'method'         => 'POST',
			'path'           => '/sites/%s/plugins/new',
			'path_labels'    => array( '$site' => '(int|string) Site' ),
			'request_format' => array( 'zip' => '(array)' ),
		);
	}

	/**
	 * The capability-failure cleanup must only remove an attachment the caller owns.
	 */
	public function test_plugins_new_does_not_delete_another_users_attachment_on_cap_failure() {
		$attachment_id = $this->create_attachment( self::$admin_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_plugins' );

		$this->assertInstanceOf( WP_Error::class, $result, 'An Author must fail the install_plugins check.' );
		$this->assertNotNull( get_post( $attachment_id ), "Another user's attachment must survive a failed capability check." );
	}

	public function test_themes_new_does_not_delete_another_users_attachment_on_cap_failure() {
		$attachment_id = $this->create_attachment( self::$admin_id );
		$endpoint      = new Jetpack_JSON_API_Themes_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_themes' );

		$this->assertInstanceOf( WP_Error::class, $result, 'An Author must fail the install_themes check.' );
		$this->assertNotNull( get_post( $attachment_id ), "Another user's attachment must survive a failed capability check." );
	}

	/**
	 * The legitimate behavior must be unchanged: a caller's own upload is still
	 * cleaned up when their capability check fails.
	 */
	public function test_plugins_new_still_deletes_own_attachment_on_cap_failure() {
		$attachment_id = $this->create_attachment( self::$author_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_plugins' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNull( get_post( $attachment_id ), "The caller's own upload should still be cleaned up." );
	}

	public function test_themes_new_still_deletes_own_attachment_on_cap_failure() {
		$attachment_id = $this->create_attachment( self::$author_id );
		$endpoint      = new Jetpack_JSON_API_Themes_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_themes' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNull( get_post( $attachment_id ), "The caller's own upload should still be cleaned up." );
	}

	/**
	 * A non-attachment post ID must not be deleted either.
	 */
	public function test_plugins_new_does_not_delete_non_attachment_post() {
		$post_id  = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
		$endpoint = new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $post_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_plugins' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNotNull( get_post( $post_id ), 'A non-attachment post must never be deleted by the cleanup path.' );
	}

	/**
	 * A non-scalar id must be skipped rather than cast to int.
	 */
	public function test_plugins_new_ignores_non_scalar_attachment_id() {
		$attachment_id = $this->create_attachment( self::$admin_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => array( $attachment_id ) ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_plugins' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNotNull( get_post( $attachment_id ), 'A non-scalar id must not be cast and deleted.' );
	}

	/**
	 * The caller still receives the capability error. Only Replace short-circuits
	 * to an ownership error.
	 */
	public function test_plugins_new_returns_capability_error_not_ownership_error() {
		$attachment_id = $this->create_attachment( self::$admin_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, 'install_plugins' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'unauthorized', $result->get_error_code() );
		$this->assertStringContainsString( 'install_plugins', $result->get_error_message() );
	}

	/**
	 * Invoke one of the protected folder_exists helpers.
	 *
	 * @param object $endpoint Endpoint instance.
	 * @param string $name     Method name.
	 * @param array  $args     Arguments.
	 * @return mixed
	 */
	private function invoke_protected( $endpoint, $name, array $args ) {
		$class  = new ReflectionClass( $endpoint );
		$method = $class->getMethod( $name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invokeArgs( $endpoint, $args );
	}

	private function make_plugins_endpoint() {
		return new Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub( $this->endpoint_args(), array() );
	}

	/**
	 * Stand-in for Automatic_Install_Skin once run() has set the install error.
	 *
	 * @param mixed $result Value of the skin's public $result.
	 * @return stdClass
	 */
	private function make_skin( $result ) {
		$skin         = new stdClass();
		$skin->result = $result;
		return $skin;
	}

	/**
	 * Stand-in for Plugin_Upgrader once check_package() has read the zip's headers.
	 *
	 * @param array $new_plugin_data Value of the upgrader's public $new_plugin_data.
	 * @return stdClass
	 */
	private function make_upgrader( array $new_plugin_data ) {
		$upgrader                  = new stdClass();
		$upgrader->new_plugin_data = $new_plugin_data;
		return $upgrader;
	}

	private function folder_exists_skin( $destination = '/srv/htdocs/wp-content/plugins/akismet/' ) {
		return $this->make_skin( new WP_Error( 'folder_exists', 'Destination folder already exists.', $destination ) );
	}

	public function test_folder_exists_error_carries_uploaded_plugin_identity() {
		$endpoint = $this->make_plugins_endpoint();
		$error    = new WP_Error( 'folder_exists', 'Destination folder already exists.', 400 );

		$this->invoke_protected(
			$endpoint,
			'add_folder_exists_data',
			array(
				$error,
				$this->folder_exists_skin(),
				$this->make_upgrader(
					array(
						'Name'    => 'Akismet Anti-spam',
						'Version' => '5.3.1',
					)
				),
			)
		);

		$this->assertSame(
			array(
				'plugin_slug'    => 'akismet',
				'plugin_version' => '5.3.1',
				'plugin_name'    => 'Akismet Anti-spam',
			),
			$error->get_error_data( 'additional_data' )
		);
	}

	public function test_folder_exists_payload_preserves_primary_error_contract() {
		$endpoint = $this->make_plugins_endpoint();
		$error    = new WP_Error( 'folder_exists', 'Destination folder already exists.', 400 );

		$this->invoke_protected(
			$endpoint,
			'add_folder_exists_data',
			array( $error, $this->folder_exists_skin(), $this->make_upgrader( array( 'Version' => '5.3.1' ) ) )
		);

		$this->assertSame( 'folder_exists', $error->get_error_code() );
		$this->assertSame( 'Destination folder already exists.', $error->get_error_message() );

		$serialized = WPCOM_JSON_API::serializable_error( $error );
		$this->assertSame( 400, $serialized['status_code'] );
		$this->assertSame( 'folder_exists', $serialized['errors']['error'] );
		$this->assertSame( 'Destination folder already exists.', $serialized['errors']['message'] );
		$this->assertSame( 'akismet', $serialized['errors']['data']['plugin_slug'] );
	}

	public function test_folder_exists_payload_omitted_when_no_slug_derived() {
		$endpoint = $this->make_plugins_endpoint();
		$error    = new WP_Error( 'folder_exists', 'Destination folder already exists.', 400 );

		$this->invoke_protected(
			$endpoint,
			'add_folder_exists_data',
			array( $error, $this->make_skin( false ), $this->make_upgrader( array( 'Version' => '5.3.1' ) ) )
		);

		$this->assertSame( array( 'folder_exists' ), $error->get_error_codes() );
		$this->assertNull( $error->get_error_data( 'additional_data' ) );

		$serialized = WPCOM_JSON_API::serializable_error( $error );
		$this->assertArrayNotHasKey( 'data', $serialized['errors'] );
	}

	public function test_folder_exists_payload_omits_version_and_name_when_headers_are_empty() {
		$endpoint = $this->make_plugins_endpoint();
		$error    = new WP_Error( 'folder_exists', 'Destination folder already exists.', 400 );

		$this->invoke_protected(
			$endpoint,
			'add_folder_exists_data',
			array( $error, $this->folder_exists_skin(), $this->make_upgrader( array() ) )
		);

		$this->assertSame( array( 'plugin_slug' => 'akismet' ), $error->get_error_data( 'additional_data' ) );
	}

	/**
	 * @param mixed  $result   Value of the skin's public $result.
	 * @param string $expected Expected slug.
	 * @dataProvider provide_folder_exists_slugs
	 */
	#[DataProvider( 'provide_folder_exists_slugs' )]
	public function test_folder_exists_slug_derivation( $result, $expected ) {
		$slug = $this->invoke_protected( $this->make_plugins_endpoint(), 'get_folder_exists_slug', array( $this->make_skin( $result ) ) );

		$this->assertSame( $expected, $slug );
	}

	public static function provide_folder_exists_slugs() {
		return array(
			'trailing slash'    => array( new WP_Error( 'folder_exists', '', '/srv/htdocs/wp-content/plugins/jetpack/' ), 'jetpack' ),
			'no trailing slash' => array( new WP_Error( 'folder_exists', '', '/srv/htdocs/wp-content/plugins/jetpack' ), 'jetpack' ),
			'dotted folder'     => array( new WP_Error( 'folder_exists', '', '/wp-content/plugins/wp-super-cache.old/' ), 'wp-super-cache.old' ),
			'traversal segment' => array( new WP_Error( 'folder_exists', '', '/wp-content/plugins/../' ), '' ),
			'empty destination' => array( new WP_Error( 'folder_exists', '', '' ), '' ),
			'non-string data'   => array( new WP_Error( 'folder_exists', '', array( 'path' => '/plugins/jetpack/' ) ), '' ),
			'different code'    => array( new WP_Error( 'copy_dir_failed', '', '/wp-content/plugins/jetpack/' ), '' ),
			'no result'         => array( false, '' ),
			'non-error result'  => array( array( 'destination_name' => 'jetpack' ), '' ),
		);
	}
}

/**
 * Test stub that stubs input() to return a fixed payload, avoiding the need to
 * bootstrap a full API request.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Plugins_New_Endpoint_Test_Stub extends Jetpack_JSON_API_Plugins_New_Endpoint {
	private $stub_input;

	public function __construct( $args, $input ) {
		parent::__construct( $args );
		$this->stub_input = $input;
	}

	public function input( $return_default_values = true, $cast_and_filter = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->stub_input;
	}
}

/**
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Themes_New_Endpoint_Test_Stub extends Jetpack_JSON_API_Themes_New_Endpoint {
	private $stub_input;

	public function __construct( $args, $input ) {
		parent::__construct( $args );
		$this->stub_input = $input;
	}

	public function input( $return_default_values = true, $cast_and_filter = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->stub_input;
	}
}
