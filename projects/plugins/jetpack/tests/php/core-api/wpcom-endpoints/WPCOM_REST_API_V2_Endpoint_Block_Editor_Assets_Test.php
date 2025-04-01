<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets class.
 *
 * @package Jetpack
 */

use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets.
 */
class WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets_Test extends Jetpack_REST_TestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Instance of WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets.
	 *
	 * @var WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets
	 */
	private $instance;

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets();

		// Mock the enqueue_block_editor_assets action to prevent loading non-existent files
		remove_all_actions( 'enqueue_block_editor_assets' );
		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_block_editor_assets' ) );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		// Remove our mock action
		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_block_editor_assets' ) );
		parent::tear_down();
	}

	/**
	 * Mock function for block editor assets.
	 * This provides minimal required assets without loading actual files.
	 */
	public function mock_block_editor_assets() {
		// Register minimal mock assets that don't require actual files
		wp_register_script( 'mock-editor-script', 'http://example.org/mock-editor.js', array(), '1.0', true );
		wp_register_style( 'mock-editor-style', 'http://example.org/mock-editor.css', array(), '1.0' );

		// Enqueue our mock assets
		wp_enqueue_script( 'mock-editor-script' );
		wp_enqueue_style( 'mock-editor-style' );
	}

	/**
	 * Mock the asset path to prevent actual file loading
	 *
	 * @param string $path The original asset path.
	 * @param string $filename The asset filename.
	 * @return string
	 */
	public function mock_asset_path( $path, $filename ) {
		if ( strpos( $filename, 'block-inserter-modifications' ) !== false ) {
			return __DIR__ . '/fixtures/mock-asset.php';
		}
		return $path;
	}

	/**
	 * Test that the class implements WP_REST_Controller.
	 */
	public function test_class_implements_rest_controller() {
		$this->assertInstanceOf( WP_REST_Controller::class, $this->instance );
	}

	/**
	 * Test the permissions check for users who can edit posts.
	 */
	public function test_get_items_permissions_check_with_edit_posts_capability() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'contributor' ) ) );
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->assertTrue( $this->instance->get_items_permissions_check( $request ) );
	}

	/**
	 * Test the permissions check for users who cannot edit posts.
	 */
	public function test_get_items_permissions_check_without_edit_posts_capability() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$result  = $this->instance->get_items_permissions_check( $request );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cannot_read_block_editor_assets', $result->get_error_code() );
	}

	/**
	 * Test that the schema is returned correctly.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( Requests::OPTIONS, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema = ( new WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets() )->get_public_item_schema();

		$this->assertEquals( $schema, $data['schema'] );
		$this->assertEquals( 'wpcom/v2', $data['namespace'] );
		$this->assertEquals( array( Requests::GET ), $data['methods'] );
	}

	/**
	 * Test that get_items returns the expected structure.
	 */
	public function test_get_items() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'styles', $data );
		$this->assertArrayHasKey( 'scripts', $data );
		$this->assertIsString( $data['styles'] );
		$this->assertIsString( $data['scripts'] );
	}
}
