<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Block_Editor_Assets class.
 *
 * @package Jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;
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

		// Remove existing actions to prevent failed loading of files that may or
		// may not exist depending on the build output.
		remove_all_actions( 'enqueue_block_editor_assets' );
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
		$this->assertContains( 'jetpack/tiled-gallery', $data['allowed_block_types'] );
		$this->assertContains( 'jetpack/subscriptions', $data['allowed_block_types'] );
	}

	/**
	 * Test that allowed plugins assets are included.
	 */
	public function test_get_items_returns_allowed_plugin_assets() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_allowed_plugin_assets' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the allowed plugin script and style are in the output
		$this->assertStringContainsString( 'jetpack-mock-script', $data['scripts'] );
		$this->assertStringContainsString( 'jetpack-mock-style', $data['styles'] );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_allowed_plugin_assets' ) );
	}

	/**
	 * Enqueue allowed plugin assets.
	 */
	public function mock_allowed_plugin_assets() {
		// Register minimal mock assets that don't require actual files
		wp_register_script( 'jetpack-mock-script', 'http://example.org/mock-editor.js', array(), '1.0', true );
		wp_register_style( 'jetpack-mock-style', 'http://example.org/mock-editor.css', array(), '1.0' );

		// Enqueue our mock assets
		wp_enqueue_script( 'jetpack-mock-script' );
		wp_enqueue_style( 'jetpack-mock-style' );
	}

	/**
	 * Test that disallowed plugin assets are filtered out.
	 */
	public function test_disallowed_plugin_assets_are_filtered() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_disallowed_plugin_assets' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the disallowed plugin script and style are not in the output
		$this->assertStringNotContainsString( 'disallowed-plugin-script', $data['scripts'] );
		$this->assertStringNotContainsString( 'disallowed-plugin-style', $data['styles'] );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_disallowed_plugin_assets' ) );
	}

	/**
	 * Enqueue disallowed plugin assets.
	 */
	public function mock_disallowed_plugin_assets() {
		wp_register_script( 'disallowed-plugin-script', 'http://example.org/script.js', array(), '1.0', true );
		wp_register_style( 'disallowed-plugin-style', 'http://example.org/style.css', array(), '1.0' );

		wp_enqueue_script( 'disallowed-plugin-script' );
		wp_enqueue_style( 'disallowed-plugin-style' );
	}

	/**
	 * Test that core dependencies are excluded from HTML output.
	 */
	public function test_core_dependencies_excluded_from_output() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify wp-edit-post script and style are NOT in the output (filtered out)
		$this->assertStringNotContainsString( 'wp-edit-post', $data['scripts'], 'wp-edit-post script should be excluded' );
		$this->assertStringNotContainsString( 'wp-edit-post', $data['styles'], 'wp-edit-post style should be excluded' );

		// Verify postbox script is NOT in the output (filtered out)
		$this->assertStringNotContainsString( 'postbox', $data['scripts'], 'postbox script should be excluded' );

		// Verify jQuery is NOT in the output (filtered out)
		$this->assertStringNotContainsString( 'jquery', $data['scripts'], 'jQuery should be excluded' );
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

	/**
	 * Test that plugin scripts registered before endpoint execution are preserved.
	 */
	public function test_plugin_scripts_registered_during_init_are_preserved() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Directly register scripts to simulate what happens during init
		wp_register_script( 'jetpack-init-test-script', 'http://example.org/jetpack-init.js', array(), '1.0', true );
		wp_register_script( 'videopress-init-test-script', 'http://example.org/videopress-init.js', array(), '1.0', true );
		wp_register_script( 'jp-init-test-script', 'http://example.org/jp-init.js', array(), '1.0', true );
		wp_register_script( 'wp-init-test-script', 'http://example.org/wp-init.js', array(), '1.0', true );
		// Register a disallowed script that should not be preserved
		wp_register_script( 'random-plugin-script', 'http://example.org/random-plugin.js', array(), '1.0', true );

		// Add enqueue action to test that preserved scripts can be enqueued
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_test_scripts' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Use string matching like the working tests
		$this->assertStringContainsString( 'jetpack-init-test-script', $data['scripts'], 'jetpack- prefixed script should be preserved' );
		$this->assertStringContainsString( 'videopress-init-test-script', $data['scripts'], 'videopress- prefixed script should be preserved' );
		$this->assertStringContainsString( 'jp-init-test-script', $data['scripts'], 'jp- prefixed script should be preserved' );
		$this->assertStringContainsString( 'wp-init-test-script', $data['scripts'], 'wp- prefixed script should be preserved' );

		// Verify disallowed scripts are not in the output (they should be filtered out by unregister_disallowed_plugin_assets)
		$this->assertStringNotContainsString( 'random-plugin-script', $data['scripts'], 'Disallowed plugin script should not be preserved' );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_test_scripts' ) );
	}

	/**
	 * Enqueue test scripts during block editor asset loading.
	 */
	public function enqueue_test_scripts() {
		wp_enqueue_script( 'jetpack-init-test-script' );
		wp_enqueue_script( 'videopress-init-test-script' );
		wp_enqueue_script( 'jp-init-test-script' );
		wp_enqueue_script( 'wp-init-test-script' );
		wp_enqueue_script( 'random-plugin-script' );
	}

	/**
	 * Test that plugin styles registered before endpoint execution are preserved.
	 */
	public function test_plugin_styles_registered_during_init_are_preserved() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Directly register styles to simulate what happens during init
		wp_register_style( 'jetpack-init-test-style', 'http://example.org/jetpack-init.css', array(), '1.0' );
		wp_register_style( 'videopress-init-test-style', 'http://example.org/videopress-init.css', array(), '1.0' );
		wp_register_style( 'jp-init-test-style', 'http://example.org/jp-init.css', array(), '1.0' );
		wp_register_style( 'wp-init-test-style', 'http://example.org/wp-init.css', array(), '1.0' );
		// Register a disallowed style that should not be preserved
		wp_register_style( 'random-plugin-style', 'http://example.org/random-plugin.css', array(), '1.0' );

		// Add enqueue action to test that preserved styles can be enqueued
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_test_styles' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Use string matching like the working tests
		$this->assertStringContainsString( 'jetpack-init-test-style', $data['styles'], 'jetpack- prefixed style should be preserved' );
		$this->assertStringContainsString( 'videopress-init-test-style', $data['styles'], 'videopress- prefixed style should be preserved' );
		$this->assertStringContainsString( 'jp-init-test-style', $data['styles'], 'jp- prefixed style should be preserved' );
		$this->assertStringContainsString( 'wp-init-test-style', $data['styles'], 'wp- prefixed style should be preserved' );

		// Verify disallowed styles are not in the output
		$this->assertStringNotContainsString( 'random-plugin-style', $data['styles'], 'Disallowed plugin style should not be preserved' );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_test_styles' ) );
	}

	/**
	 * Enqueue test styles during block editor asset loading.
	 */
	public function enqueue_test_styles() {
		wp_enqueue_style( 'jetpack-init-test-style' );
		wp_enqueue_style( 'videopress-init-test-style' );
		wp_enqueue_style( 'jp-init-test-style' );
		wp_enqueue_style( 'wp-init-test-style' );
		wp_enqueue_style( 'random-plugin-style' );
	}

	/**
	 * Test that preserved scripts maintain their properties and inline scripts.
	 */
	public function test_preserved_scripts_maintain_properties() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Register a complex script with inline script
		wp_register_script(
			'jetpack-complex-test-script',
			'http://example.org/jetpack-complex.js',
			array(),
			'2.5.0',
			true
		);
		wp_add_inline_script( 'jetpack-complex-test-script', 'var jetpackConfig = { enabled: true };', 'before' );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_complex_test_script' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the complex script is preserved and its inline script is included
		$this->assertStringContainsString( 'jetpack-complex-test-script', $data['scripts'], 'Complex jetpack script should be preserved' );
		$this->assertStringContainsString( 'jetpackConfig', $data['scripts'], 'Inline script should be preserved' );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_complex_test_script' ) );
	}

	/**
	 * Enqueue complex test script.
	 */
	public function enqueue_complex_test_script() {
		wp_enqueue_script( 'jetpack-complex-test-script' );
	}

	/**
	 * Test the make_url_absolute method converts URLs correctly.
	 *
	 * @param string $input_url The input URL.
	 * @param string $expected_url The expected URL after conversion.
	 * @dataProvider url_conversion_data_provider
	 */
	#[DataProvider( 'url_conversion_data_provider' )]
	public function test_make_url_absolute( $input_url, $expected_url ) {
		// Use the public method directly
		$result = $this->instance->make_url_absolute( $input_url );
		$this->assertSame( $expected_url, $result );
	}

	/**
	 * Data provider for URL conversion tests.
	 *
	 * @return array Test data.
	 */
	public static function url_conversion_data_provider() {
		$site_url = site_url();
		return array(
			'relative URL starting with /'        => array( '/wp-admin/script.js', $site_url . '/wp-admin/script.js' ),
			'relative URL with wp-includes'       => array( '/wp-includes/js/jquery.js', $site_url . '/wp-includes/js/jquery.js' ),
			'protocol-relative URL'               => array( '//example.com/script.js', '//example.com/script.js' ),
			'absolute URL with http'              => array( 'http://example.com/script.js', 'http://example.com/script.js' ),
			'absolute URL with https'             => array( 'https://example.com/script.js', 'https://example.com/script.js' ),
			'empty string'                        => array( '', '' ),
			'relative path without leading slash' => array( 'script.js', 'script.js' ),
			'URL with query parameters'           => array( '/wp-admin/script.js?ver=1.0', $site_url . '/wp-admin/script.js?ver=1.0' ),
			'URL with hash'                       => array( '/wp-admin/page#section', $site_url . '/wp-admin/page#section' ),
		);
	}

	/**
	 * Test that URL conversion filters are applied during asset generation.
	 */
	public function test_url_conversion_filters_are_applied() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Track filter application
		$filters_applied = array(
			'script' => false,
			'style'  => false,
		);

		// Add tracking filters at priority 5 (before our filter at 10)
		add_filter(
			'script_loader_src',
			function ( $src ) use ( &$filters_applied ) {
				$filters_applied['script'] = true;
				return $src;
			},
			5,
			2
		);

		add_filter(
			'style_loader_src',
			function ( $src ) use ( &$filters_applied ) {
				$filters_applied['style'] = true;
				return $src;
			},
			5,
			2
		);

		// Enqueue some plugin assets so the filters get triggered
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'jetpack-filter-test', 'http://example.org/test.js', array(), '1.0', true );
				wp_register_style( 'jetpack-filter-test-style', 'http://example.org/test.css', array(), '1.0' );
				wp_enqueue_script( 'jetpack-filter-test' );
				wp_enqueue_style( 'jetpack-filter-test-style' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		$this->assertTrue( $filters_applied['script'], 'Script filter was not applied' );
		$this->assertTrue( $filters_applied['style'], 'Style filter was not applied' );

		// Clean up
		remove_all_filters( 'script_loader_src', 5 );
		remove_all_filters( 'style_loader_src', 5 );
	}

	/**
	 * Test that the make_url_absolute method converts relative URLs to absolute URLs.
	 */
	public function test_relative_urls_are_converted_to_absolute() {
		// Test that the make_url_absolute method correctly converts relative URLs
		$test_url = $this->instance->make_url_absolute( '/custom/path/script.js' );
		$this->assertStringContainsString( site_url(), $test_url, 'Relative URLs should be converted to absolute' );
		$this->assertEquals( site_url() . '/custom/path/script.js', $test_url );
	}

	/**
	 * Test that URL conversion filters are removed after processing.
	 */
	public function test_url_conversion_filters_are_removed_after_processing() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		// Check that our filters are not present after the request
		$this->assertFalse( has_filter( 'script_loader_src', array( $this->instance, 'make_url_absolute' ) ), 'Script filter should be removed after processing' );
		$this->assertFalse( has_filter( 'style_loader_src', array( $this->instance, 'make_url_absolute' ) ), 'Style filter should be removed after processing' );
	}

	/**
	 * Test that the screen is properly configured as a block editor.
	 */
	public function test_screen_is_configured_as_block_editor() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		$this->assertTrue( $screen_captured->is_block_editor(), 'Screen should be marked as block editor' );
		$this->assertSame( 'post', $screen_captured->base, 'Screen base should be "post"' );
	}

	/**
	 * Test that the correct post type is set on the screen.
	 */
	public function test_screen_post_type_is_set_correctly() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		// Test with default post type
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		$this->assertSame( 'post', $screen_captured->post_type, 'Default post type should be "post"' );
		$this->assertSame( 'post', $screen_captured->base, 'Screen base is always "post" for edit screens' );
		$this->assertSame( 'post', $screen_captured->id, 'Screen ID is always "post" for edit screens' );
	}

	/**
	 * Test that custom post type is properly handled.
	 */
	public function test_screen_handles_custom_post_type() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Register a custom post type
		register_post_type( 'custom_test_type', array( 'show_in_rest' => true ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		// Set the post_type query var
		set_query_var( 'post_type', 'custom_test_type' );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		$this->assertSame( 'custom_test_type', $screen_captured->post_type, 'Custom post type should be set on screen' );
		$this->assertSame( 'post', $screen_captured->base, 'Screen base is always "post" for edit screens' );
		$this->assertSame( 'post', $screen_captured->id, 'Screen ID is always "post" for edit screens' );

		// Cleanup
		unregister_post_type( 'custom_test_type' );
		set_query_var( 'post_type', null );
	}

	/**
	 * Test that array post type uses the first value.
	 */
	public function test_screen_handles_array_post_type() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		// Set the post_type query var as an array (edge case)
		set_query_var( 'post_type', array( 'page', 'post' ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		$this->assertSame( 'page', $screen_captured->post_type, 'First post type from array should be used' );
		$this->assertSame( 'post', $screen_captured->base, 'Screen base is always "post" for edit screens' );
		$this->assertSame( 'post', $screen_captured->id, 'Screen ID is always "post" for edit screens' );

		// Cleanup
		set_query_var( 'post_type', null );
	}

	/**
	 * Test that invalid post type falls back to default 'post'.
	 */
	public function test_screen_handles_invalid_post_type() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$screen_captured = null;

		$action = function () use ( &$screen_captured ) {
			$screen_captured = get_current_screen();
		};

		add_action( 'enqueue_block_editor_assets', $action, 1 );

		// Set an invalid post type that doesn't exist
		set_query_var( 'post_type', 'nonexistent_post_type' );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action, 1 );

		$this->assertNotNull( $screen_captured, 'Screen should be captured' );
		// Should fall back to 'post' when invalid post type provided
		$this->assertSame( 'post', $screen_captured->post_type, 'Should fall back to "post" for invalid post type' );
		$this->assertSame( 'post', $screen_captured->base, 'Screen base should be "post"' );
		$this->assertSame( 'post', $screen_captured->id, 'Screen ID should be "post"' );

		// Cleanup
		set_query_var( 'post_type', null );
	}

	/**
	 * Test that plugins calling get_current_screen() don't cause fatal errors.
	 */
	public function test_no_fatal_error_when_plugin_calls_get_current_screen() {
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

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );

		remove_action( 'enqueue_block_editor_assets', $action );

		$this->assertTrue( $callback_executed, 'Plugin callback should execute without fatal error' );
		$this->assertInstanceOf( WP_REST_Response::class, $response, 'Request should complete successfully' );
	}
}
