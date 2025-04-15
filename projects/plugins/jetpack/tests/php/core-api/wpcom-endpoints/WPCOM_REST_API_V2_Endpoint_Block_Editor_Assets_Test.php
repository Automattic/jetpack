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

	/**
	 * Test that get_items returns the expected block types.
	 */
	public function test_get_items_returns_allowed_block_types() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify allowed block types are present
		$this->assertArrayHasKey( 'allowed_block_types', $data );
		$this->assertIsArray( $data['allowed_block_types'] );

		// Test core blocks are included
		$core_blocks = array_filter(
			$data['allowed_block_types'],
			function ( $block_name ) {
				return strpos( $block_name, 'core/' ) === 0;
			}
		);
		$this->assertNotEmpty( $core_blocks );

		// Test Jetpack blocks are included
		$jetpack_blocks = array_filter(
			$data['allowed_block_types'],
			function ( $block_name ) {
				return strpos( $block_name, 'jetpack/' ) === 0;
			}
		);
		$this->assertNotEmpty( $jetpack_blocks );

		// Test specific known blocks are present
		$this->assertContains( 'jetpack/contact-form', $data['allowed_block_types'] );
		$this->assertContains( 'jetpack/subscriptions', $data['allowed_block_types'] );
	}

	/**
	 * Test that disallowed plugin assets are filtered out.
	 */
	public function test_disallowed_plugin_assets_are_filtered() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Register a disallowed plugin asset
		wp_register_script( 'disallowed-plugin', 'http://example.org/disallowed-plugin/script.js', array(), '1.0', true );
		wp_enqueue_script( 'disallowed-plugin' );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the disallowed plugin script is not in the output
		$this->assertStringNotContainsString( 'disallowed-plugin/script.js', $data['scripts'] );
	}

	/**
	 * Test that protected core handles are preserved.
	 */
	public function test_protected_handles_are_preserved() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Ensure jQuery (a protected handle) is enqueued
		wp_enqueue_script( 'jquery' );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify jQuery is in the output
		$this->assertStringContainsString( 'jquery', $data['scripts'] );
	}

	/**
	 * Test that required WordPress actions are triggered.
	 */
	public function test_required_wordpress_actions_are_triggered() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$wp_loaded_triggered           = false;
		$block_assets_triggered        = false;
		$block_editor_assets_triggered = false;

		add_action(
			'wp_loaded',
			function () use ( &$wp_loaded_triggered ) {
				$wp_loaded_triggered = true;
			}
		);

		add_action(
			'enqueue_block_assets',
			function () use ( &$block_assets_triggered ) {
				$block_assets_triggered = true;
			}
		);

		add_action(
			'enqueue_block_editor_assets',
			function () use ( &$block_editor_assets_triggered ) {
				$block_editor_assets_triggered = true;
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		$this->assertTrue( $wp_loaded_triggered, 'wp_loaded action was not triggered' );
		$this->assertTrue( $block_assets_triggered, 'enqueue_block_assets action was not triggered' );
		$this->assertTrue( $block_editor_assets_triggered, 'enqueue_block_editor_assets action was not triggered' );
	}

	/**
	 * Test response when user has edit capability for custom post types.
	 */
	public function test_get_items_permissions_check_with_custom_post_type() {
		// Register a custom post type.
		register_post_type(
			'custom_type',
			array(
				'show_in_rest' => true,
				'capabilities' => array(
					'edit_posts' => 'edit_custom_type',
				),
			)
		);

		// Create a role with custom capability.
		add_role(
			'custom_editor',
			'Custom Editor',
			array(
				'edit_custom_type' => true,
			)
		);

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'custom_editor' ) ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->assertTrue( $this->instance->get_items_permissions_check( $request ) );

		// Cleanup.
		unregister_post_type( 'custom_type' );
		remove_role( 'custom_editor' );
	}
}
