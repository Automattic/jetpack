<?php
/**
 * Tests for the plugins/new and themes/new JSON API endpoints.
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use PHPUnit\Framework\Attributes\CoversClass;

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
