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
	 * Test that protected core handles are preserved.
	 */
	public function test_protected_handles_are_preserved() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify jQuery is in the output
		$this->assertStringContainsString( 'jquery', $data['scripts'] );
	}

	/**
	 * Test that WPCOM-specific Gutenberg assets are preserved.
	 */
	public function test_wpcom_gutenberg_assets_are_preserved() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_wpcom_gutenberg_assets' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the WPCOM Gutenberg assets are preserved in the output
		$this->assertStringContainsString( 'wpcom-gutenberg-script', $data['scripts'] );
		$this->assertStringContainsString( 'wpcom-gutenberg-style', $data['styles'] );
		$this->assertStringContainsString( 'plugins/gutenberg-core/script.js', $data['scripts'] );
		$this->assertStringContainsString( 'plugins/gutenberg-core/style.css', $data['styles'] );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_wpcom_gutenberg_assets' ) );
	}

	/**
	 * Enqueue assets using WPCOM's specific Gutenberg paths.
	 */
	public function mock_wpcom_gutenberg_assets() {
		wp_register_script( 'wpcom-gutenberg-script', 'http://example.org/wp-content/plugins/gutenberg-core/script.js', array(), '1.0', true );
		wp_register_style( 'wpcom-gutenberg-style', 'http://example.org/wp-content/plugins/gutenberg-core/style.css', array(), '1.0' );

		wp_enqueue_script( 'wpcom-gutenberg-script' );
		wp_enqueue_style( 'wpcom-gutenberg-style' );
	}

	/**
	 * Test that WPCOM-specific Gutenberg assets are preserved when served from a CDN.
	 */
	public function test_wpcom_gutenberg_assets_are_preserved_with_cdn_urls() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_cdn_gutenberg_assets' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify CDN-served Gutenberg assets are preserved in the output
		$this->assertStringContainsString( 'cdn-gutenberg-script', $data['scripts'] );
		$this->assertStringContainsString( 'cdn-gutenberg-style', $data['styles'] );
		$this->assertStringContainsString( 'plugins/gutenberg/script.js', $data['scripts'] );
		$this->assertStringContainsString( 'plugins/gutenberg/style.css', $data['styles'] );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_cdn_gutenberg_assets' ) );
	}

	/**
	 * Enqueue Gutenberg assets using a CDN domain.
	 */
	public function mock_cdn_gutenberg_assets() {
		wp_register_script( 'cdn-gutenberg-script', 'https://cdn.example.com/wp-content/plugins/gutenberg/script.js', array(), '1.0', true );
		wp_register_style( 'cdn-gutenberg-style', 'https://cdn.example.com/wp-content/plugins/gutenberg/style.css', array(), '1.0' );

		wp_enqueue_script( 'cdn-gutenberg-script' );
		wp_enqueue_style( 'cdn-gutenberg-style' );
	}

	/**
	 * Test that WPCOM-specific gutenberg-core assets are preserved when served from a CDN.
	 */
	public function test_wpcom_gutenberg_core_assets_are_preserved_with_cdn_urls() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'mock_cdn_gutenberg_core_assets' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify CDN-served WPCOM Gutenberg core assets are preserved in the output
		$this->assertStringContainsString( 'cdn-gutenberg-core-script', $data['scripts'] );
		$this->assertStringContainsString( 'cdn-gutenberg-core-style', $data['styles'] );
		$this->assertStringContainsString( 'plugins/gutenberg-core/script.js', $data['scripts'] );
		$this->assertStringContainsString( 'plugins/gutenberg-core/style.css', $data['styles'] );

		remove_action( 'enqueue_block_editor_assets', array( $this, 'mock_cdn_gutenberg_core_assets' ) );
	}

	/**
	 * Enqueue WPCOM Gutenberg core assets using a CDN domain.
	 */
	public function mock_cdn_gutenberg_core_assets() {
		wp_register_script( 'cdn-gutenberg-core-script', 'https://cdn.example.com/wp-content/plugins/gutenberg-core/script.js', array(), '1.0', true );
		wp_register_style( 'cdn-gutenberg-core-style', 'https://cdn.example.com/wp-content/plugins/gutenberg-core/style.css', array(), '1.0' );

		wp_enqueue_script( 'cdn-gutenberg-core-script' );
		wp_enqueue_style( 'cdn-gutenberg-core-style' );
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
	 * Test that preserved scripts maintain their properties and dependencies.
	 */
	public function test_preserved_scripts_maintain_properties() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Register a complex script with dependencies
		wp_register_script(
			'jetpack-complex-test-script',
			'http://example.org/jetpack-complex.js',
			array( 'jquery', 'wp-data', 'wp-blocks' ),
			'2.5.0',
			true
		);
		wp_add_inline_script( 'jetpack-complex-test-script', 'var jetpackConfig = { enabled: true };', 'before' );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_complex_test_script' ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify the complex script is preserved and its dependencies are loaded
		$this->assertStringContainsString( 'jetpack-complex-test-script', $data['scripts'], 'Complex jetpack script should be preserved' );
		$this->assertStringContainsString( 'jquery', $data['scripts'], 'jQuery dependency should be present' );
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

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$this->server->dispatch( $request );

		$this->assertTrue( $filters_applied['script'], 'Script filter was not applied' );
		$this->assertTrue( $filters_applied['style'], 'Style filter was not applied' );

		// Clean up
		remove_all_filters( 'script_loader_src', 5 );
		remove_all_filters( 'style_loader_src', 5 );
	}

	/**
	 * Test that relative URLs in assets are converted to absolute URLs.
	 */
	public function test_relative_urls_are_converted_to_absolute() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Register assets with relative URLs
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'jetpack-relative-test', '/wp-content/plugins/test/script.js', array(), '1.0', true );
				wp_register_style( 'jetpack-relative-style', '/wp-content/plugins/test/style.css', array(), '1.0' );

				wp_enqueue_script( 'jetpack-relative-test' );
				wp_enqueue_style( 'jetpack-relative-style' );
			}
		);

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Check that relative URLs have been converted to absolute
		$site_url = site_url();
		$this->assertStringContainsString( $site_url . '/wp-content/plugins/test/script.js', $data['scripts'] );
		$this->assertStringContainsString( $site_url . '/wp-content/plugins/test/style.css', $data['styles'] );

		// Ensure no relative URLs remain in src/href attributes
		$this->assertDoesNotMatchRegularExpression( '/src=[\'"]\//', $data['scripts'], 'Found relative URL in script src' );
		$this->assertDoesNotMatchRegularExpression( '/href=[\'"]\//', $data['styles'], 'Found relative URL in style href' );
	}

	/**
	 * Test that core WordPress assets with relative URLs are converted to absolute.
	 */
	public function test_core_assets_urls_are_absolute() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$site_url = site_url();

		// Check that any wp-includes or wp-admin paths are absolute (either local or CDN)
		if ( strpos( $data['scripts'], 'wp-includes' ) !== false || strpos( $data['scripts'], 'wp-admin' ) !== false ) {
			// Verify URLs are absolute (not relative)
			preg_match_all( '/(?:src|href)=[\'"]([^\'"]+)[\'"]/', $data['scripts'], $script_urls );
			foreach ( $script_urls[1] as $url ) {
				if ( strpos( $url, 'wp-includes' ) !== false || strpos( $url, 'wp-admin' ) !== false ) {
					// URL should be absolute - either starts with site URL, http://, https://, or // (protocol-relative)
					$is_absolute = (
						strpos( $url, $site_url ) === 0 ||
						strpos( $url, 'http://' ) === 0 ||
						strpos( $url, 'https://' ) === 0 ||
						strpos( $url, '//' ) === 0
					);
					$this->assertTrue( $is_absolute, "Core script URL should be absolute, got: {$url}" );

					// Ensure it's not a relative URL (starting with / but not //)
					if ( strpos( $url, '/' ) === 0 ) {
						$this->assertStringStartsWith( '//', $url, "URL starting with / should be protocol-relative (//), got: {$url}" );
					}
				}
			}
		}

		if ( strpos( $data['styles'], 'wp-includes' ) !== false || strpos( $data['styles'], 'wp-admin' ) !== false ) {
			// Verify URLs are absolute (not relative)
			preg_match_all( '/(?:src|href)=[\'"]([^\'"]+)[\'"]/', $data['styles'], $style_urls );
			foreach ( $style_urls[1] as $url ) {
				if ( strpos( $url, 'wp-includes' ) !== false || strpos( $url, 'wp-admin' ) !== false ) {
					// URL should be absolute - either starts with site URL, http://, https://, or // (protocol-relative)
					$is_absolute = (
						strpos( $url, $site_url ) === 0 ||
						strpos( $url, 'http://' ) === 0 ||
						strpos( $url, 'https://' ) === 0 ||
						strpos( $url, '//' ) === 0
					);
					$this->assertTrue( $is_absolute, "Core style URL should be absolute, got: {$url}" );

					// Ensure it's not a relative URL (starting with / but not //)
					if ( strpos( $url, '/' ) === 0 ) {
						$this->assertStringStartsWith( '//', $url, "URL starting with / should be protocol-relative (//), got: {$url}" );
					}
				}
			}
		}
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

	/**
	 * Test exclude parameter with 'core' value excludes WordPress core assets.
	 */
	public function test_exclude_parameter_with_core() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// First, verify core assets ARE present without exclusions
		$request_without_exclude  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response_without_exclude = $this->server->dispatch( $request_without_exclude );
		$data_without_exclude     = $response_without_exclude->get_data();

		$this->assertStringContainsString( '/wp-includes/', $data_without_exclude['scripts'], 'Core scripts should be present without exclusions' );
		$this->assertStringContainsString( '/wp-admin/', $data_without_exclude['scripts'], 'Core admin scripts should be present without exclusions' );
		$this->assertStringContainsString( '/wp-includes/', $data_without_exclude['styles'], 'Core styles should be present without exclusions' );
		$this->assertStringContainsString( '/wp-admin/', $data_without_exclude['styles'], 'Core admin styles should be present without exclusions' );

		// Now verify they ARE excluded with 'exclude=core'
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Core assets should be excluded (wp-includes, wp-admin paths)
		$this->assertStringNotContainsString( '/wp-includes/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-admin/css/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-admin/js/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-includes/', $data['styles'] );
		$this->assertStringNotContainsString( '/wp-admin/css/', $data['styles'] );
		$this->assertStringNotContainsString( '/wp-admin/js/', $data['styles'] );
	}

	/**
	 * Test exclude parameter with 'gutenberg' value excludes Gutenberg plugin assets.
	 */
	public function test_exclude_parameter_with_gutenberg() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add mock Gutenberg assets
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'gutenberg-test-script', 'http://example.org/plugins/gutenberg/script.js', array(), '1.0', true );
				wp_register_style( 'gutenberg-test-style', 'http://example.org/plugins/gutenberg/style.css', array(), '1.0' );
				wp_enqueue_script( 'gutenberg-test-script' );
				wp_enqueue_style( 'gutenberg-test-style' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'gutenberg' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Gutenberg assets should be excluded
		$this->assertStringNotContainsString( 'plugins/gutenberg/', $data['scripts'] );
		$this->assertStringNotContainsString( 'plugins/gutenberg/', $data['styles'] );
	}

	/**
	 * Test exclude parameter with 'gutenberg' value excludes CDN-served Gutenberg assets.
	 */
	public function test_exclude_parameter_with_cdn_gutenberg() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add mock CDN-served Gutenberg assets with jetpack- prefix so they survive unregister_disallowed_plugin_assets
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'jetpack-cdn-gutenberg-script', 'https://cdn.example.com/wp-content/plugins/gutenberg/script.js', array(), '1.0', true );
				wp_register_style( 'jetpack-cdn-gutenberg-style', 'https://cdn.example.com/wp-content/plugins/gutenberg/style.css', array(), '1.0' );
				wp_enqueue_script( 'jetpack-cdn-gutenberg-script' );
				wp_enqueue_style( 'jetpack-cdn-gutenberg-style' );
			}
		);

		// First, verify CDN assets ARE present without exclusion
		$request_without_exclude  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response_without_exclude = $this->server->dispatch( $request_without_exclude );
		$data_without_exclude     = $response_without_exclude->get_data();

		$this->assertStringContainsString( 'plugins/gutenberg/script.js', $data_without_exclude['scripts'], 'CDN Gutenberg script should be present without exclusion' );
		$this->assertStringContainsString( 'plugins/gutenberg/style.css', $data_without_exclude['styles'], 'CDN Gutenberg style should be present without exclusion' );

		// Now verify they ARE excluded with 'exclude=gutenberg'
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'gutenberg' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// CDN-served Gutenberg assets should be excluded
		$this->assertStringNotContainsString( 'plugins/gutenberg/script.js', $data['scripts'], 'CDN Gutenberg script should be excluded' );
		$this->assertStringNotContainsString( 'plugins/gutenberg/style.css', $data['styles'], 'CDN Gutenberg style should be excluded' );
	}

	/**
	 * Test exclude parameter with both 'core' and 'gutenberg' values.
	 */
	public function test_exclude_parameter_with_core_and_gutenberg() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core,gutenberg' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Both core and Gutenberg assets should be excluded
		$this->assertStringNotContainsString( '/wp-includes/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-admin/css/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-admin/js/', $data['scripts'] );
		$this->assertStringNotContainsString( 'plugins/gutenberg/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-includes/', $data['styles'] );
		$this->assertStringNotContainsString( '/wp-admin/css/', $data['styles'] );
		$this->assertStringNotContainsString( '/wp-admin/js/', $data['styles'] );
		$this->assertStringNotContainsString( 'plugins/gutenberg/', $data['styles'] );
	}

	/**
	 * Test exclude parameter with plugin handle prefix.
	 */
	public function test_exclude_parameter_with_plugin_handle() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add mock plugin assets with specific prefix
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'contact-form-7-script', 'http://example.org/contact-form.js', array(), '1.0', true );
				wp_register_style( 'contact-form-7-style', 'http://example.org/contact-form.css', array(), '1.0' );
				wp_enqueue_script( 'contact-form-7-script' );
				wp_enqueue_style( 'contact-form-7-style' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'contact-form-7' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Plugin assets with the specified handle prefix should be excluded
		$this->assertStringNotContainsString( 'contact-form-7-script', $data['scripts'] );
		$this->assertStringNotContainsString( 'contact-form-7-style', $data['styles'] );
	}

	/**
	 * Test that without exclude parameter, all assets are included.
	 */
	public function test_without_exclude_parameter_includes_all_assets() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Core assets should be present
		$this->assertNotEmpty( $data['scripts'] );
		$this->assertNotEmpty( $data['styles'] );

		// Verify specific core paths are included when no exclusions are applied
		$this->assertStringContainsString( '/wp-includes/', $data['scripts'], 'Core wp-includes scripts should be present without exclusions' );
		$this->assertStringContainsString( '/wp-admin/js/', $data['scripts'], 'Core wp-admin scripts should be present without exclusions' );
		$this->assertStringContainsString( '/wp-includes/', $data['styles'], 'Core wp-includes styles should be present without exclusions' );
		$this->assertStringContainsString( '/wp-admin/css/', $data['styles'], 'Core wp-admin styles should be present without exclusions' );
	}

	/**
	 * Test that plugin assets are preserved when excluding core.
	 */
	public function test_plugin_assets_preserved_when_excluding_core() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add mock plugin assets
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'jetpack-test-exclude', 'http://example.org/jetpack-test.js', array(), '1.0', true );
				wp_register_style( 'jetpack-test-exclude-style', 'http://example.org/jetpack-test.css', array(), '1.0' );
				wp_enqueue_script( 'jetpack-test-exclude' );
				wp_enqueue_style( 'jetpack-test-exclude-style' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Jetpack assets should still be present
		$this->assertStringContainsString( 'jetpack-test-exclude', $data['scripts'] );
		$this->assertStringContainsString( 'jetpack-test-exclude-style', $data['styles'] );

		// Core assets should be excluded
		$this->assertStringNotContainsString( '/wp-includes/', $data['scripts'] );
		$this->assertStringNotContainsString( '/wp-admin/js/', $data['scripts'] );
	}

	/**
	 * Test that Jetpack styles are preserved when excluding core (regression test for bug).
	 */
	public function test_jetpack_styles_preserved_with_exclude_core() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add Jetpack-style assets with inline styles (common pattern)
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_style( 'jetpack-blocks-editor', 'http://example.org/jetpack-blocks.css', array(), '1.0' );
				wp_enqueue_style( 'jetpack-blocks-editor' );
				wp_add_inline_style( 'jetpack-blocks-editor', '.jetpack-block { color: blue; }' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Jetpack styles should be present (this was the bug - they were being incorrectly filtered out)
		$this->assertStringContainsString( 'jetpack-blocks-editor', $data['styles'] );
		$this->assertStringContainsString( 'jetpack-block { color: blue; }', $data['styles'] );
	}

	/**
	 * Test excluding multiple plugin types simultaneously.
	 */
	public function test_multiple_plugin_exclusions() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add multiple plugin assets
		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'contact-form-7-script', 'http://example.org/cf7.js', array(), '1.0', true );
				wp_register_script( 'woocommerce-script', 'http://example.org/woo.js', array(), '1.0', true );
				wp_register_script( 'jetpack-test-script', 'http://example.org/jetpack.js', array(), '1.0', true );
				wp_enqueue_script( 'contact-form-7-script' );
				wp_enqueue_script( 'woocommerce-script' );
				wp_enqueue_script( 'jetpack-test-script' );
			}
		);

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'contact-form-7,woocommerce' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Contact Form 7 and WooCommerce should be excluded
		$this->assertStringNotContainsString( 'contact-form-7-script', $data['scripts'] );
		$this->assertStringNotContainsString( 'woocommerce-script', $data['scripts'] );

		// Jetpack should still be present
		$this->assertStringContainsString( 'jetpack-test-script', $data['scripts'] );
	}

	/**
	 * Test that conditional comments containing core scripts are excluded.
	 *
	 * @phan-suppress PhanPluginUnreachableCode Test is temporarily skipped
	 */
	public function test_conditional_comments_with_core_script_exclusion() {
		$this->markTestSkipped( 'Fails on CI "PHP tests: PHP 8.2 WP trunk" only; need to find a fix. https://github.com/Automattic/jetpack/actions/runs/19121651646/job/54686608995' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// First, verify conditional comment IS present without exclusion
		$request_without_exclude  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response_without_exclude = $this->server->dispatch( $request_without_exclude );
		$data_without_exclude     = $response_without_exclude->get_data();

		// Look for the conditional comment wrapper (IE conditional comments are preserved in output)
		$this->assertStringContainsString( '<!--[if lt IE 8]>', $data_without_exclude['scripts'], 'Conditional comment should be present without exclusion' );
		$this->assertStringContainsString( 'wp-includes/js/json2', $data_without_exclude['scripts'], 'Core script inside conditional comment should be present without exclusion' );

		// Now verify conditional comment IS excluded with 'exclude=core'
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Conditional comment containing core script should be completely removed
		$this->assertStringNotContainsString( 'json2.js', $data['scripts'], 'Core script inside conditional comment should be excluded' );
	}

	/**
	 * Test that conditional comments containing Gutenberg scripts are excluded.
	 */
	public function test_conditional_comments_with_gutenberg_script_exclusion() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add a mock Gutenberg script wrapped in a conditional comment
		add_filter(
			'script_loader_tag',
			function ( $tag, $handle ) {
				if ( 'gutenberg-ie-test' === $handle ) {
					return '<!--[if lt IE 9]>' . $tag . '<![endif]-->';
				}
				return $tag;
			},
			10,
			2
		);

		add_action(
			'enqueue_block_editor_assets',
			function () {
				$gutenberg_url = plugins_url( 'gutenberg' );
				wp_register_script( 'gutenberg-ie-test', $gutenberg_url . '/ie-compat.js', array(), '1.0', true );
				wp_enqueue_script( 'gutenberg-ie-test' );
			}
		);

		// First, verify conditional comment IS present without exclusion
		$request_without_exclude  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response_without_exclude = $this->server->dispatch( $request_without_exclude );
		$data_without_exclude     = $response_without_exclude->get_data();

		$this->assertStringContainsString( 'gutenberg/ie-compat.js', $data_without_exclude['scripts'], 'Gutenberg script in conditional comment should be present without exclusion' );

		// Now verify it's excluded with 'exclude=gutenberg'
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'gutenberg' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertStringNotContainsString( 'gutenberg/ie-compat.js', $data['scripts'], 'Gutenberg script in conditional comment should be excluded' );
		$this->assertStringNotContainsString( 'gutenberg-ie-test', $data['scripts'], 'Gutenberg script handle in conditional comment should be excluded' );
	}

	/**
	 * Test that conditional comments are preserved when they contain non-excluded scripts.
	 */
	public function test_conditional_comments_preserved_for_non_excluded_scripts() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Add a Jetpack script wrapped in a conditional comment
		add_filter(
			'script_loader_tag',
			function ( $tag, $handle ) {
				if ( 'jetpack-ie-compat' === $handle ) {
					return '<!--[if lt IE 9]>' . $tag . '<![endif]-->';
				}
				return $tag;
			},
			10,
			2
		);

		add_action(
			'enqueue_block_editor_assets',
			function () {
				wp_register_script( 'jetpack-ie-compat', 'http://example.org/jetpack-ie.js', array(), '1.0', true );
				wp_enqueue_script( 'jetpack-ie-compat' );
			}
		);

		// Use exclude=core (should NOT exclude Jetpack)
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$request->set_param( 'exclude', 'core' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Jetpack script in conditional comment should still be present
		$this->assertStringContainsString( 'jetpack-ie.js', $data['scripts'], 'Jetpack script in conditional comment should be preserved when excluding core' );
		$this->assertStringContainsString( 'jetpack-ie-compat', $data['scripts'], 'Jetpack script handle should be preserved' );
	}

	/**
	 * Test that wpforms-lite callback is not executed after hook removal.
	 *
	 * This test creates a mock wpforms-lite plugin structure and verifies
	 * that callbacks from that plugin are removed before execution.
	 *
	 * @phan-suppress PhanUndeclaredClassMethod, PhanUndeclaredClassStaticProperty, PhanUndeclaredClassInCallable
	 */
	public function test_wpforms_callback_is_not_executed_after_hook_removal() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// Create a mock wpforms-lite plugin directory and class file
		$plugins_dir         = WP_PLUGIN_DIR . '/wpforms-lite';
		$plugin_file         = $plugins_dir . '/wpforms-mock.php';
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
				if ( ! class_exists( "WPForms_Mock_Class" ) ) {
					class WPForms_Mock_Class {
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

		// Mock is_plugin_active() to return true for wpforms-lite (simulates production scenario)
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
		WPForms_Mock_Class::$callback_executed = false;

		// Create an instance of the mock class (needed for object method callback detection)
		$wpforms_instance = new WPForms_Mock_Class();

		// Add callback from the mock wpforms-lite plugin using instance method
		add_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ), 10 );

		// Verify the hook is registered before the request
		$this->assertTrue( has_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ) ) !== false, 'Hook should be registered before request' );

		// Make the REST request - this should trigger remove_problematic_plugin_hooks
		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/editor-assets' );
		$response = $this->server->dispatch( $request );

		// Should return 200
		$this->assertEquals( 200, $response->get_status() );

		// CRITICAL: The callback should NOT have executed because it was removed
		$this->assertFalse( WPForms_Mock_Class::$callback_executed, 'WPForms callback should NOT execute after hook removal - this test MUST fail when remove_problematic_plugin_hooks() is disabled' );

		// Clean up
		remove_action( 'enqueue_block_editor_assets', array( $wpforms_instance, 'mock_callback' ), 10 );

		// Remove temporary files if we created them
		if ( $created_plugin_file ) {
			unlink( $plugin_file );
		}
		if ( $created_plugin_dir ) {
			// Only remove directory if it's empty (to avoid failures if other files exist)
			$dir_contents = scandir( $plugins_dir );
			$is_empty     = count( $dir_contents ) === 2; // Only '.' and '..' remain
			if ( $is_empty ) {
				rmdir( $plugins_dir );
			}
		}
	}
}
