<?php
/**
 * Tests for WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets class.
 *
 * @package Jetpack
 */

use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Test class for WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets.
 */
class WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets_Test extends Jetpack_REST_TestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Instance of WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets.
	 *
	 * @var WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets
	 */
	private $instance;

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets();

		// Remove existing actions to prevent failed loading of files that may or
		// may not exist depending on the build output.
		remove_all_actions( 'enqueue_block_editor_assets' );
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
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$this->assertTrue( $this->instance->get_items_permissions_check( $request ) );
	}

	/**
	 * Test the permissions check for users who cannot edit posts.
	 */
	public function test_get_items_permissions_check_without_edit_posts_capability() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$result  = $this->instance->get_items_permissions_check( $request );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cannot_read_block_editor_assets', $result->get_error_code() );
	}

	/**
	 * Test that the schema is returned correctly.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( Requests::OPTIONS, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema = ( new WPCOM_REST_API_V2_1_Endpoint_Block_Editor_Assets() )->get_public_item_schema();

		$this->assertEquals( $schema, $data['schema'] );
		$this->assertEquals( 'wpcom/v2.1', $data['namespace'] );
		$this->assertEquals( array( Requests::GET ), $data['methods'] );
	}

	/**
	 * Test that get_items returns 501 when Gutenberg endpoint is unavailable.
	 *
	 * Note: This test is skipped when Gutenberg IS available (normal testing environment).
	 * It documents the expected behavior but requires Gutenberg to be absent to test.
	 */
	public function test_get_items_returns_501_when_gutenberg_unavailable() {
		// Skip if Gutenberg endpoint is available (which it normally is)
		if ( class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is available. This test verifies behavior when Gutenberg is not installed.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 501, $response->get_status() );
		$this->assertSame( 'gutenberg_endpoint_unavailable', $response->get_data()['code'] );
	}

	/**
	 * Test that get_items returns the expected JSON structure.
	 */
	public function test_get_items_returns_json_structure() {
		// Skip if Gutenberg endpoint is not available
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertIsArray( $data );

		// Verify response has the expected keys from Gutenberg's endpoint
		$this->assertArrayHasKey( 'scripts', $data );
		$this->assertArrayHasKey( 'styles', $data );
		$this->assertArrayHasKey( 'inline_scripts', $data );
		$this->assertArrayHasKey( 'inline_styles', $data );

		// Verify scripts and styles are objects (not HTML strings like v2)
		$this->assertIsArray( $data['scripts'], 'Scripts should be an array/object, not a string' );
		$this->assertIsArray( $data['styles'], 'Styles should be an array/object, not a string' );
	}

	/**
	 * Test that scripts contain proper metadata structure.
	 */
	public function test_scripts_contain_metadata() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Check that at least one script has the expected structure
		if ( ! empty( $data['scripts'] ) ) {
			$first_script = reset( $data['scripts'] );
			$this->assertArrayHasKey( 'src', $first_script, 'Script should have src' );
			$this->assertArrayHasKey( 'deps', $first_script, 'Script should have deps' );
			$this->assertArrayHasKey( 'version', $first_script, 'Script should have version' );
		}
	}

	/**
	 * Test that styles contain proper metadata structure.
	 */
	public function test_styles_contain_metadata() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Check that at least one style has the expected structure
		if ( ! empty( $data['styles'] ) ) {
			$first_style = reset( $data['styles'] );
			$this->assertArrayHasKey( 'src', $first_style, 'Style should have src' );
			$this->assertArrayHasKey( 'deps', $first_style, 'Style should have deps' );
			$this->assertArrayHasKey( 'version', $first_style, 'Style should have version' );
		}
	}

	/**
	 * Test that response does NOT include allowed_block_types (v2.1 design decision).
	 */
	public function test_response_does_not_include_allowed_block_types() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// v2.1 does NOT return allowed_block_types (clients should use settings endpoint)
		$this->assertArrayNotHasKey( 'allowed_block_types', $data, 'v2.1 should not return allowed_block_types' );
	}

	/**
	 * Test that relative URLs in scripts are converted to absolute.
	 */
	public function test_script_urls_are_converted_to_absolute() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$site_url = site_url();

		// Check all script URLs are absolute
		foreach ( $data['scripts'] as $handle => $script ) {
			if ( ! empty( $script['src'] ) ) {
				$is_absolute = (
					strpos( $script['src'], 'http://' ) === 0 ||
					strpos( $script['src'], 'https://' ) === 0 ||
					strpos( $script['src'], '//' ) === 0 ||
					strpos( $script['src'], $site_url ) === 0
				);
				$this->assertTrue( $is_absolute, "Script URL should be absolute: {$script['src']} (handle: {$handle})" );

				// Ensure it's not a single-slash relative URL
				if ( strpos( $script['src'], '/' ) === 0 ) {
					$this->assertStringStartsWith( '//', $script['src'], "URL starting with / should be protocol-relative: {$script['src']}" );
				}
			}
		}
	}

	/**
	 * Test that relative URLs in styles are converted to absolute.
	 */
	public function test_style_urls_are_converted_to_absolute() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$site_url = site_url();

		// Check all style URLs are absolute
		foreach ( $data['styles'] as $handle => $style ) {
			if ( ! empty( $style['src'] ) ) {
				$is_absolute = (
					strpos( $style['src'], 'http://' ) === 0 ||
					strpos( $style['src'], 'https://' ) === 0 ||
					strpos( $style['src'], '//' ) === 0 ||
					strpos( $style['src'], $site_url ) === 0
				);
				$this->assertTrue( $is_absolute, "Style URL should be absolute: {$style['src']} (handle: {$handle})" );

				// Ensure it's not a single-slash relative URL
				if ( strpos( $style['src'], '/' ) === 0 ) {
					$this->assertStringStartsWith( '//', $style['src'], "URL starting with / should be protocol-relative: {$style['src']}" );
				}
			}
		}
	}

	/**
	 * Test that script module URLs are converted to absolute.
	 */
	public function test_script_module_urls_are_converted_to_absolute() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		if ( ! empty( $data['script_modules'] ) ) {
			$site_url = site_url();

			foreach ( $data['script_modules'] as $id => $src ) {
				if ( ! empty( $src ) ) {
					$is_absolute = (
						strpos( $src, 'http://' ) === 0 ||
						strpos( $src, 'https://' ) === 0 ||
						strpos( $src, '//' ) === 0 ||
						strpos( $src, $site_url ) === 0
					);
					$this->assertTrue( $is_absolute, "Script module URL should be absolute: {$src} (id: {$id})" );
				}
			}
		}
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

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$this->assertTrue( $this->instance->get_items_permissions_check( $request ) );

		// Cleanup.
		unregister_post_type( 'custom_type' );
		remove_role( 'custom_editor' );
	}

	/**
	 * Test that the screen is properly configured as a block editor.
	 */
	public function test_screen_is_configured_as_block_editor() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		$this->assertTrue( $screen_captured->is_block_editor(), 'Screen should be marked as block editor' );
	}

	/**
	 * Test that plugins calling get_current_screen() don't cause fatal errors.
	 */
	public function test_no_fatal_error_when_plugin_calls_get_current_screen() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$callback_executed = false;

		// Simulate a plugin/theme that calls get_current_screen() during enqueue
		$action = function () use ( &$callback_executed ) {
			// This is what plugins do that was causing fatal errors
			$screen = get_current_screen();

			// If we get here without fatal error, test passes
			$callback_executed = true;

			// Verify we can actually use the screen object
			$this->assertNotNull( $screen );
			$this->assertIsString( $screen->base );
		};

		add_action( 'enqueue_block_editor_assets', $action );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action );

		$this->assertTrue( $callback_executed, 'Plugin callback should execute without fatal error' );
		$this->assertInstanceOf( WP_REST_Response::class, $response, 'Request should complete successfully' );
	}

	/**
	 * Test that wpforms-lite callback is not executed after hook removal.
	 *
	 * @phan-suppress PhanUndeclaredClassMethod, PhanUndeclaredClassStaticProperty, PhanUndeclaredClassInCallable
	 */
	public function test_wpforms_callback_is_not_executed_after_hook_removal() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Create a mock wpforms-lite plugin directory and class file
		$plugins_dir         = WP_PLUGIN_DIR . '/wpforms-lite';
		$plugin_file         = $plugins_dir . '/wpforms-mock-v21.php';
		$created_plugin_dir  = false;
		$created_plugin_file = false;

		// Create temporary plugin structure if it doesn't exist
		if ( ! is_dir( $plugins_dir ) ) {
			mkdir( $plugins_dir, 0777, true );
			$created_plugin_dir = true;
		}

		if ( ! file_exists( $plugin_file ) ) {
			file_put_contents(
				$plugin_file,
				'<?php
				if ( ! class_exists( "WPForms_Mock_Class_V21" ) ) {
					class WPForms_Mock_Class_V21 {
						public static $callback_executed = false;
						public function mock_callback() {
							self::$callback_executed = true;
						}
					}
				}'
			);
			$created_plugin_file = true;
		}

		// Include the mock plugin file
		require_once $plugin_file;

		// Mock is_plugin_active() to return true for wpforms-lite
		add_filter(
			'option_active_plugins',
			function ( $plugins ) {
				if ( ! in_array( 'wpforms-lite/wpforms.php', $plugins, true ) ) {
					$plugins[] = 'wpforms-lite/wpforms.php';
				}
				return $plugins;
			}
		);

		// Reset the static flag
		WPForms_Mock_Class_V21::$callback_executed = false;

		// Create an instance of the mock class
		$wpforms_instance = new WPForms_Mock_Class_V21();

		// Add callback from the mock wpforms-lite plugin
		add_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ), 10 );

		// Verify the hook is registered before the request
		$this->assertTrue( has_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ) ) !== false, 'Hook should be registered before request' );

		// Make the REST request
		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );

		// Should return 200
		$this->assertEquals( 200, $response->get_status() );

		// CRITICAL: The callback should NOT have executed because it was removed
		$this->assertFalse( WPForms_Mock_Class_V21::$callback_executed, 'WPForms callback should NOT execute after hook removal' );

		// Clean up
		remove_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ), 10 );

		// Remove temporary files if we created them
		if ( $created_plugin_file ) {
			unlink( $plugin_file );
		}
		if ( $created_plugin_dir ) {
			$dir_contents = scandir( $plugins_dir );
			$is_empty     = count( $dir_contents ) === 2;
			if ( $is_empty ) {
				rmdir( $plugins_dir );
			}
		}
	}

	/**
	 * Test that inline scripts are included in response.
	 */
	public function test_inline_scripts_are_included() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'inline_scripts', $data );
		$this->assertIsArray( $data['inline_scripts'] );

		// Check structure if inline scripts exist
		if ( ! empty( $data['inline_scripts'] ) ) {
			$this->assertArrayHasKey( 'before', $data['inline_scripts'] );
			$this->assertArrayHasKey( 'after', $data['inline_scripts'] );
		}
	}

	/**
	 * Test that inline styles are included in response.
	 */
	public function test_inline_styles_are_included() {
		if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
			$this->markTestSkipped( 'Gutenberg endpoint is not available.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2.1/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'inline_styles', $data );
		$this->assertIsArray( $data['inline_styles'] );

		// Check structure if inline styles exist
		if ( ! empty( $data['inline_styles'] ) ) {
			$this->assertArrayHasKey( 'before', $data['inline_styles'] );
			$this->assertArrayHasKey( 'after', $data['inline_styles'] );
		}
	}

	/**
	 * Test that filter_allowed_block_types only applies for gutenberg_kit context.
	 */
	public function test_filter_allowed_block_types_only_applies_for_gutenberg_kit_context() {
		// Create a non-gutenberg_kit context
		$context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) );

		// Pass true (all blocks allowed) - should return unchanged for non-gutenberg_kit context
		$result = $this->instance->filter_allowed_block_types( true, $context );
		$this->assertTrue( $result, 'Filter should return true unchanged for non-gutenberg_kit context' );

		// Pass an array - should return unchanged for non-gutenberg_kit context
		$blocks = array( 'core/paragraph', 'core/freeform', 'random-plugin/block' );
		$result = $this->instance->filter_allowed_block_types( $blocks, $context );
		$this->assertSame( $blocks, $result, 'Filter should return blocks unchanged for non-gutenberg_kit context' );
	}

	/**
	 * Test that filter_allowed_block_types returns unchanged for null context.
	 */
	public function test_filter_allowed_block_types_returns_unchanged_for_null_context() {
		$blocks = array( 'core/paragraph', 'core/freeform' );
		$result = $this->instance->filter_allowed_block_types( $blocks, null );
		$this->assertSame( $blocks, $result, 'Filter should return blocks unchanged for null context' );
	}

	/**
	 * Test that core/freeform is excluded in gutenberg_kit context.
	 */
	public function test_filter_allowed_block_types_excludes_freeform() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'gutenberg_kit' ) );
		$blocks  = array( 'core/paragraph', 'core/freeform', 'core/heading' );

		$result = $this->instance->filter_allowed_block_types( $blocks, $context );

		$this->assertContains( 'core/paragraph', $result, 'core/paragraph should be allowed' );
		$this->assertContains( 'core/heading', $result, 'core/heading should be allowed' );
		$this->assertNotContains( 'core/freeform', $result, 'core/freeform should be excluded' );
	}

	/**
	 * Test that only ALLOWED_PLUGIN_BLOCKS are included in gutenberg_kit context.
	 */
	public function test_filter_allowed_block_types_only_allows_specified_plugin_blocks() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'gutenberg_kit' ) );
		$blocks  = array(
			'core/paragraph',
			'jetpack/tiled-gallery',       // In ALLOWED_PLUGIN_BLOCKS
			'jetpack/subscriptions',       // In ALLOWED_PLUGIN_BLOCKS
			'random-plugin/some-block',    // NOT in ALLOWED_PLUGIN_BLOCKS
			'woocommerce/product-grid',    // NOT in ALLOWED_PLUGIN_BLOCKS
		);

		$result = $this->instance->filter_allowed_block_types( $blocks, $context );

		$this->assertContains( 'core/paragraph', $result, 'core/paragraph should be allowed' );
		$this->assertContains( 'jetpack/tiled-gallery', $result, 'jetpack/tiled-gallery should be allowed' );
		$this->assertContains( 'jetpack/subscriptions', $result, 'jetpack/subscriptions should be allowed' );
		$this->assertNotContains( 'random-plugin/some-block', $result, 'random-plugin/some-block should be excluded' );
		$this->assertNotContains( 'woocommerce/product-grid', $result, 'woocommerce/product-grid should be excluded' );
	}

	/**
	 * Test that filter converts true to filtered array in gutenberg_kit context.
	 */
	public function test_filter_allowed_block_types_converts_true_to_filtered_array() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'gutenberg_kit' ) );

		// Register some test blocks
		$registry = WP_Block_Type_Registry::get_instance();

		// Check if blocks are already registered, if not register them
		if ( ! $registry->is_registered( 'test/allowed-block' ) ) {
			register_block_type( 'test/allowed-block', array() );
		}
		if ( ! $registry->is_registered( 'jetpack/tiled-gallery' ) ) {
			register_block_type( 'jetpack/tiled-gallery', array() );
		}

		// Pass true (all blocks allowed) - should return filtered array
		$result = $this->instance->filter_allowed_block_types( true, $context );

		$this->assertIsArray( $result, 'Filter should convert true to array for gutenberg_kit context' );
		$this->assertNotContains( 'core/freeform', $result, 'core/freeform should be excluded' );
		$this->assertNotContains( 'test/allowed-block', $result, 'Non-allowed plugin blocks should be excluded' );

		// If jetpack/tiled-gallery was registered, it should be in the result
		if ( $registry->is_registered( 'jetpack/tiled-gallery' ) ) {
			$this->assertContains( 'jetpack/tiled-gallery', $result, 'jetpack/tiled-gallery should be allowed' );
		}

		// Clean up
		if ( $registry->is_registered( 'test/allowed-block' ) ) {
			unregister_block_type( 'test/allowed-block' );
		}
	}

	/**
	 * Test that all core blocks except disallowed ones are allowed.
	 */
	public function test_filter_allowed_block_types_allows_most_core_blocks() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'gutenberg_kit' ) );
		$blocks  = array(
			'core/paragraph',
			'core/heading',
			'core/image',
			'core/list',
			'core/quote',
			'core/code',
			'core/freeform', // This one should be excluded
		);

		$result = $this->instance->filter_allowed_block_types( $blocks, $context );

		// All core blocks except freeform should be allowed
		$this->assertContains( 'core/paragraph', $result );
		$this->assertContains( 'core/heading', $result );
		$this->assertContains( 'core/image', $result );
		$this->assertContains( 'core/list', $result );
		$this->assertContains( 'core/quote', $result );
		$this->assertContains( 'core/code', $result );
		$this->assertNotContains( 'core/freeform', $result );
	}

	/**
	 * Test that a8c and premium-content blocks are allowed.
	 */
	public function test_filter_allowed_block_types_allows_a8c_and_premium_content_blocks() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'gutenberg_kit' ) );
		$blocks  = array(
			'a8c/blog-posts',
			'a8c/posts-carousel',
			'premium-content/container',
			'premium-content/subscriber-view',
		);

		$result = $this->instance->filter_allowed_block_types( $blocks, $context );

		$this->assertContains( 'a8c/blog-posts', $result );
		$this->assertContains( 'a8c/posts-carousel', $result );
		$this->assertContains( 'premium-content/container', $result );
		$this->assertContains( 'premium-content/subscriber-view', $result );
	}
}
