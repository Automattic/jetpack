<?php
/**
 * Image Studio extension tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\ImageStudio;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

/**
 * Image Studio extension tests.
 */
class Image_Studio_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Get the AI image extensions list from the source function.
	 *
	 * AI image extensions that Image Studio replaces.
	 *
	 * @return array
	 */
	private static function get_ai_image_extensions() {
		return ImageStudio\get_ai_image_extensions();
	}

	/**
	 * Saved current screen for restoration in tear_down.
	 *
	 * @var mixed
	 */
	private $saved_screen;

	/**
	 * Saved wp_scripts global.
	 *
	 * @var mixed
	 */
	private $saved_wp_scripts;

	/**
	 * Saved wp_styles global.
	 *
	 * @var mixed
	 */
	private $saved_wp_styles;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_transient( ImageStudio\ASSET_TRANSIENT );
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$this->saved_wp_styles  = $GLOBALS['wp_styles'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();
		$GLOBALS['wp_styles']   = new WP_Styles();
		$this->reset_availability();
		unset( $_GET['enable_image_studio'] );
		$this->saved_screen = $GLOBALS['current_screen'] ?? null;
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( ImageStudio\ASSET_TRANSIENT );
		remove_all_filters( 'jetpack_image_studio_enabled' );
		remove_all_filters( 'agents_manager_use_unified_experience' );
		remove_all_filters( 'agents_manager_agent_providers' );
		remove_all_filters( 'pre_http_request' );
		unset( $_GET['enable_image_studio'] );
		$GLOBALS['current_screen'] = $this->saved_screen;
		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
		$GLOBALS['wp_styles']      = $this->saved_wp_styles;
		parent::tear_down();
	}

	/**
	 * Reset Jetpack Gutenberg extension availability.
	 */
	private function reset_availability() {
		$reflection = new ReflectionClass( 'Jetpack_Gutenberg' );
		$property   = $reflection->getProperty( 'availability' );
		@$property->setAccessible( true ); // @codingStandardsIgnoreLine — needed for PHP < 8.1, suppressed for PHP 8.5+ deprecation.
		$property->setValue( null, array() );
	}

	/**
	 * Enable Image Studio via jetpack_image_studio_enabled filter.
	 */
	private function enable_image_studio() {
		add_filter( 'jetpack_image_studio_enabled', '__return_true' );
	}

	/**
	 * Disable Image Studio via filter.
	 */
	private function disable_image_studio() {
		add_filter( 'jetpack_image_studio_enabled', '__return_false' );
	}

	/**
	 * Enable unified chat experience filter.
	 */
	private function enable_unified_experience() {
		add_filter( 'agents_manager_use_unified_experience', '__return_true' );
	}

	/**
	 * Register all AI image extensions as available.
	 */
	private function make_ai_extensions_available() {
		foreach ( self::get_ai_image_extensions() as $ext ) {
			\Jetpack_Gutenberg::set_extension_available( $ext );
		}
	}

	/**
	 * Set the current screen to a block editor.
	 */
	private function set_block_editor_screen() {
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor = true;
	}

	/**
	 * Set the current screen to the Media Library.
	 */
	private function set_media_library_screen() {
		set_current_screen( 'upload' );
	}

	/**
	 * Enable Image Studio, cache asset data, and enqueue via block editor path.
	 *
	 * Sets up block editor screen before enqueuing.
	 *
	 * @param array|null $asset_data The asset data to cache.
	 */
	private function enable_and_enqueue_block_editor( $asset_data = null ) {
		if ( null === $asset_data ) {
			$asset_data = array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			);
		}
		$this->enable_image_studio();
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		set_transient( ImageStudio\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );
		ImageStudio\enqueue_image_studio();
	}

	/**
	 * Enable Image Studio, cache asset data, and enqueue via Media Library path.
	 *
	 * @param array|null $asset_data The asset data to cache.
	 */
	private function enable_and_enqueue_media_library( $asset_data = null ) {
		if ( null === $asset_data ) {
			$asset_data = array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			);
		}
		$this->enable_image_studio();
		$this->set_media_library_screen();
		ImageStudio\register_plugin();
		set_transient( ImageStudio\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );
		ImageStudio\enqueue_image_studio_admin();
	}

	/**
	 * Mock the remote asset manifest fetch.
	 *
	 * @param array|false $asset_data The asset data to return, or false for failure.
	 */
	private function mock_remote_asset( $asset_data ) {
		if ( false === $asset_data ) {
			add_filter(
				'pre_http_request',
				function () {
					return new WP_Error( 'http_request_failed', 'Request failed' );
				}
			);
			return;
		}

		add_filter(
			'pre_http_request',
			function () use ( $asset_data ) {
				return array(
					'response' => array( 'code' => 200 ),
					'headers'  => array( 'content-type' => 'application/json' ),
					'body'     => wp_json_encode( $asset_data, JSON_HEX_TAG | JSON_HEX_AMP ),
				);
			}
		);
	}

	/**
	 * Mock the remote asset manifest fetch with a specific HTTP status code.
	 *
	 * @param int    $status_code  The HTTP status code to return.
	 * @param string $body         The response body.
	 * @param string $content_type The Content-Type header value.
	 */
	private function mock_remote_asset_with_status( $status_code, $body = '', $content_type = 'application/json' ) {
		add_filter(
			'pre_http_request',
			function () use ( $status_code, $body, $content_type ) {
				return array(
					'response' => array( 'code' => $status_code ),
					'headers'  => array( 'content-type' => $content_type ),
					'body'     => $body,
				);
			}
		);
	}

	// -------------------------------------------------------------------------
	// is_image_studio_enabled() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_image_studio_enabled returns true when jetpack_image_studio_enabled is true.
	 */
	public function test_is_enabled_via_jetpack_filter() {
		$this->enable_image_studio();
		$this->assertTrue( ImageStudio\is_image_studio_enabled() );
	}

	/**
	 * Test is_image_studio_enabled returns true when unified experience is true.
	 */
	public function test_is_enabled_via_unified_experience() {
		$this->enable_unified_experience();
		$this->assertTrue( ImageStudio\is_image_studio_enabled() );
	}

	/**
	 * Test is_image_studio_enabled returns false when both filters are false.
	 */
	public function test_is_not_enabled_when_both_filters_false() {
		$this->assertFalse( ImageStudio\is_image_studio_enabled() );
	}

	/**
	 * Test is_image_studio_enabled returns true when both filters are true.
	 */
	public function test_is_enabled_when_both_filters_true() {
		$this->enable_image_studio();
		$this->enable_unified_experience();
		$this->assertTrue( ImageStudio\is_image_studio_enabled() );
	}

	// -------------------------------------------------------------------------
	// is_block_editor() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_block_editor returns true when current screen is a block editor.
	 */
	public function test_is_block_editor_true() {
		$this->set_block_editor_screen();
		$this->assertTrue( ImageStudio\is_block_editor() );
	}

	/**
	 * Test is_block_editor returns false on a non-editor admin screen.
	 */
	public function test_is_block_editor_false_on_other_screen() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( ImageStudio\is_block_editor() );
	}

	/**
	 * Test is_block_editor returns false when no current screen is set.
	 */
	public function test_is_block_editor_false_when_no_screen() {
		$GLOBALS['current_screen'] = null;
		$this->assertFalse( ImageStudio\is_block_editor() );
	}

	/**
	 * Test is_block_editor returns false on Media Library screen.
	 */
	public function test_is_block_editor_false_on_media_library() {
		$this->set_media_library_screen();
		$this->assertFalse( ImageStudio\is_block_editor() );
	}

	// -------------------------------------------------------------------------
	// is_media_library() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_media_library returns true when current screen is upload.
	 */
	public function test_is_media_library_true() {
		$this->set_media_library_screen();
		$this->assertTrue( ImageStudio\is_media_library() );
	}

	/**
	 * Test is_media_library returns false on a non-upload screen.
	 */
	public function test_is_media_library_false_on_other_screen() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( ImageStudio\is_media_library() );
	}

	/**
	 * Test is_media_library returns false when no current screen is set.
	 */
	public function test_is_media_library_false_when_no_screen() {
		$GLOBALS['current_screen'] = null;
		$this->assertFalse( ImageStudio\is_media_library() );
	}

	/**
	 * Test is_media_library returns false on block editor screen.
	 */
	public function test_is_media_library_false_on_block_editor() {
		$this->set_block_editor_screen();
		$this->assertFalse( ImageStudio\is_media_library() );
	}

	// -------------------------------------------------------------------------
	// should_load_on_current_screen() tests
	// -------------------------------------------------------------------------

	/**
	 * Test should_load_on_current_screen returns true on Media Library.
	 */
	public function test_should_load_on_media_library() {
		$this->set_media_library_screen();
		$this->assertTrue( ImageStudio\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns true on block editor.
	 */
	public function test_should_load_on_block_editor() {
		$this->set_block_editor_screen();
		$this->assertTrue( ImageStudio\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false on dashboard.
	 */
	public function test_should_not_load_on_dashboard() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( ImageStudio\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false when no screen.
	 */
	public function test_should_not_load_when_no_screen() {
		$GLOBALS['current_screen'] = null;
		$this->assertFalse( ImageStudio\should_load_on_current_screen() );
	}

	// -------------------------------------------------------------------------
	// register_plugin() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that register_plugin sets extension available when jetpack_image_studio_enabled is true.
	 */
	public function test_register_plugin_sets_available_when_enabled() {
		$this->enable_image_studio();
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin sets extension available when unified experience is true.
	 */
	public function test_register_plugin_sets_available_when_unified_experience() {
		$this->enable_unified_experience();
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin does not set extension available when both filters are false.
	 */
	public function test_register_plugin_not_available_when_disabled() {
		$this->disable_image_studio();
		ImageStudio\register_plugin();
		$this->assertFalse( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin registers unconditionally regardless of screen.
	 *
	 * Screen-level gating happens at enqueue time, not registration.
	 */
	public function test_register_plugin_available_regardless_of_screen() {
		$this->enable_image_studio();

		// Block editor - still registers.
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );

		$this->reset_availability();

		// Media Library - still registers.
		$this->set_media_library_screen();
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );

		$this->reset_availability();

		// Dashboard - still registers.
		set_current_screen( 'dashboard' );
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	// -------------------------------------------------------------------------
	// enqueue_image_studio() tests (block editor path)
	// -------------------------------------------------------------------------

	/**
	 * Test that script is enqueued in block editor.
	 */
	public function test_block_editor_script_enqueued_with_dependencies() {
		$this->enable_and_enqueue_block_editor(
			array(
				'version'      => '1.2.3',
				'dependencies' => array( 'wp-element', 'wp-plugins' ),
			)
		);

		$this->assertTrue( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertContains( 'wp-element', $script->deps );
		$this->assertContains( 'wp-plugins', $script->deps );
	}

	/**
	 * Test block editor enqueue does not require query param.
	 */
	public function test_block_editor_enqueued_without_query_param() {
		$this->enable_image_studio();
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		ImageStudio\enqueue_image_studio();

		$this->assertTrue( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
		$this->assertTrue( wp_style_is( ImageStudio\FEATURE_NAME . '-style', 'enqueued' ) );
	}

	/**
	 * Test nothing enqueued when not on block editor screen.
	 */
	public function test_nothing_enqueued_on_non_block_editor() {
		$this->enable_image_studio();
		set_current_screen( 'dashboard' );
		ImageStudio\register_plugin();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);
		ImageStudio\enqueue_image_studio();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test inline script sets imageStudioData with enabled true.
	 */
	public function test_inline_script_sets_image_studio_data() {
		$this->enable_and_enqueue_block_editor();

		$inline = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );

		$this->assertIsArray( $inline );
		$found = false;
		foreach ( $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'imageStudioData' ) !== false ) {
				$found = true;
				$this->assertStringContainsString( '"enabled":true', $line );
			}
		}
		$this->assertTrue( $found, 'Inline script with imageStudioData not found.' );
	}

	/**
	 * Test style is enqueued with wp-components dependency.
	 */
	public function test_style_enqueued_with_wp_components() {
		$this->enable_and_enqueue_block_editor();

		$this->assertTrue( wp_style_is( ImageStudio\FEATURE_NAME . '-style', 'enqueued' ) );

		$style = $GLOBALS['wp_styles']->registered[ ImageStudio\FEATURE_NAME . '-style' ];
		$this->assertContains( 'wp-components', $style->deps );
	}

	/**
	 * Test nothing enqueued when asset file is unavailable.
	 */
	public function test_nothing_enqueued_when_asset_unavailable() {
		$this->enable_image_studio();
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		$this->mock_remote_asset( false );

		ImageStudio\enqueue_image_studio();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
		$this->assertFalse( wp_style_is( ImageStudio\FEATURE_NAME . '-style', 'enqueued' ) );
	}

	/**
	 * Test version from asset file is used for both script and style.
	 */
	public function test_version_from_asset_file() {
		$this->enable_and_enqueue_block_editor(
			array(
				'version'      => '4.5.6',
				'dependencies' => array(),
			)
		);

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertEquals( '4.5.6', $script->ver );

		$style = $GLOBALS['wp_styles']->registered[ ImageStudio\FEATURE_NAME . '-style' ];
		$this->assertEquals( '4.5.6', $style->ver );
	}

	/**
	 * Test nothing enqueued when extension is not available (disabled).
	 */
	public function test_nothing_enqueued_when_extension_not_available() {
		$this->disable_image_studio();
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);
		ImageStudio\enqueue_image_studio();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
		$this->assertFalse( wp_style_is( ImageStudio\FEATURE_NAME . '-style', 'enqueued' ) );
	}

	/**
	 * Test script URL points to widgets.wp.com.
	 */
	public function test_script_url_points_to_widgets() {
		$this->enable_and_enqueue_block_editor();

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertStringContainsString( 'widgets.wp.com', $script->src );
		$this->assertStringContainsString( 'image-studio.min.js', $script->src );
	}

	/**
	 * Test style URL points to widgets.wp.com.
	 */
	public function test_style_url_points_to_widgets() {
		$this->enable_and_enqueue_block_editor();

		$style = $GLOBALS['wp_styles']->registered[ ImageStudio\FEATURE_NAME . '-style' ];
		$this->assertStringContainsString( 'widgets.wp.com', $style->src );
		$this->assertStringContainsString( 'image-studio', $style->src );
	}

	/**
	 * Test enqueue works with empty dependencies array.
	 */
	public function test_enqueue_with_empty_dependencies() {
		$this->enable_and_enqueue_block_editor(
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			)
		);

		$this->assertTrue( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertEmpty( $script->deps );
	}

	/**
	 * Test script is loaded in footer.
	 */
	public function test_script_loaded_in_footer() {
		$this->enable_and_enqueue_block_editor();

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertSame( 1, $script->extra['group'] );
	}

	// -------------------------------------------------------------------------
	// enqueue_image_studio_admin() tests (Media Library path)
	// -------------------------------------------------------------------------

	/**
	 * Test that script is enqueued on Media Library.
	 */
	public function test_media_library_script_enqueued() {
		$this->enable_and_enqueue_media_library();

		$this->assertTrue( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
		$this->assertTrue( wp_style_is( ImageStudio\FEATURE_NAME . '-style', 'enqueued' ) );
	}

	/**
	 * Test Media Library enqueue uses correct dependencies from asset data.
	 */
	public function test_media_library_enqueue_with_dependencies() {
		$this->enable_and_enqueue_media_library(
			array(
				'version'      => '2.0.0',
				'dependencies' => array( 'wp-element', 'wp-plugins' ),
			)
		);

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertContains( 'wp-element', $script->deps );
		$this->assertContains( 'wp-plugins', $script->deps );
		$this->assertEquals( '2.0.0', $script->ver );
	}

	/**
	 * Test nothing enqueued on non-Media Library screen via admin hook.
	 */
	public function test_media_library_nothing_enqueued_on_other_screen() {
		$this->enable_image_studio();
		set_current_screen( 'dashboard' );
		ImageStudio\register_plugin();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		ImageStudio\enqueue_image_studio_admin();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test nothing enqueued on Media Library when Image Studio is disabled.
	 */
	public function test_media_library_nothing_enqueued_when_disabled() {
		$this->disable_image_studio();
		$this->set_media_library_screen();
		ImageStudio\register_plugin();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		ImageStudio\enqueue_image_studio_admin();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test Media Library inline script sets imageStudioData.
	 */
	public function test_media_library_inline_script() {
		$this->enable_and_enqueue_media_library();

		$inline = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );

		$this->assertIsArray( $inline );
		$found = false;
		foreach ( $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'imageStudioData' ) !== false ) {
				$found = true;
				$this->assertStringContainsString( '"enabled":true', $line );
			}
		}
		$this->assertTrue( $found, 'Inline script with imageStudioData not found on Media Library.' );
	}

	// -------------------------------------------------------------------------
	// get_asset_data() tests
	// -------------------------------------------------------------------------

	/**
	 * Test transient caching of asset file after fetch.
	 */
	public function test_transient_caching_after_fetch() {
		$asset_data = array(
			'version'      => '2.0.0',
			'dependencies' => array( 'wp-element' ),
		);
		$this->mock_remote_asset( $asset_data );

		$result = ImageStudio\get_asset_data();

		$this->assertEquals( $asset_data, $result );

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			// In debug mode, asset data should not be cached in a transient.
			$this->assertFalse( get_transient( ImageStudio\ASSET_TRANSIENT ) );
		} else {
			// When not in debug mode, the transient should contain the fetched asset data.
			$this->assertEquals( $asset_data, get_transient( ImageStudio\ASSET_TRANSIENT ) );
		}
	}

	/**
	 * Test uses cached transient without HTTP request.
	 */
	public function test_uses_cached_transient() {
		$asset_data = array(
			'version'      => '3.0.0',
			'dependencies' => array( 'wp-plugins' ),
		);
		set_transient( ImageStudio\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );

		$this->mock_remote_asset( false );

		$result = ImageStudio\get_asset_data();

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data returns false on WP_Error.
	 */
	public function test_get_asset_data_returns_false_on_wp_error() {
		$this->mock_remote_asset( false );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false on non-200 HTTP status code.
	 */
	public function test_get_asset_data_returns_false_on_non_200_status() {
		$this->mock_remote_asset_with_status( 500, 'Internal Server Error' );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false on 404 HTTP status code.
	 */
	public function test_get_asset_data_returns_false_on_404_status() {
		$this->mock_remote_asset_with_status( 404, 'Not Found' );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false when response body is invalid JSON.
	 */
	public function test_get_asset_data_returns_false_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not valid json{{{' );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false when response body is a JSON string instead of array.
	 */
	public function test_get_asset_data_returns_false_on_json_string() {
		$this->mock_remote_asset_with_status( 200, '"just a string"' );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data does not set transient when fetch fails.
	 */
	public function test_get_asset_data_no_transient_on_failure() {
		$this->mock_remote_asset( false );

		ImageStudio\get_asset_data();

		$this->assertFalse( get_transient( ImageStudio\ASSET_TRANSIENT ) );
	}

	/**
	 * Test get_asset_data does not set transient when JSON is invalid.
	 */
	public function test_get_asset_data_no_transient_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not json' );

		ImageStudio\get_asset_data();

		$this->assertFalse( get_transient( ImageStudio\ASSET_TRANSIENT ) );
	}

	/**
	 * Test get_asset_data returns false when Content-Type is not JSON.
	 */
	public function test_get_asset_data_returns_false_on_non_json_content_type() {
		$this->mock_remote_asset_with_status( 200, '<html>Not JSON</html>', 'text/html' );

		$result = ImageStudio\get_asset_data();

		$this->assertFalse( $result );
	}

	// -------------------------------------------------------------------------
	// disable_jetpack_ai_image_extensions() tests
	// -------------------------------------------------------------------------

	/**
	 * Test AI image extensions are disabled when Image Studio is enabled.
	 */
	public function test_ai_extensions_disabled_when_enabled() {
		$this->enable_image_studio();
		$this->make_ai_extensions_available();

		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be unavailable when Image Studio is enabled."
			);
		}
	}

	/**
	 * Test AI image extensions are disabled when unified experience is enabled.
	 */
	public function test_ai_extensions_disabled_when_unified_experience() {
		$this->enable_unified_experience();
		$this->make_ai_extensions_available();

		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be unavailable when unified experience is enabled."
			);
		}
	}

	/**
	 * Test AI image extensions are NOT disabled when Image Studio is disabled.
	 */
	public function test_ai_extensions_not_disabled_when_disabled() {
		$this->disable_image_studio();
		$this->make_ai_extensions_available();

		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertTrue(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should remain available when Image Studio is disabled."
			);
		}
	}

	// -------------------------------------------------------------------------
	// disable_jetpack_ai_image_extensions() screen-aware tests
	// -------------------------------------------------------------------------

	/**
	 * Test AI extensions ARE disabled on block editor.
	 */
	public function test_ai_extensions_disabled_on_block_editor() {
		$this->enable_image_studio();
		$this->make_ai_extensions_available();

		$this->set_block_editor_screen();
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be disabled on block editor."
			);
		}
	}

	/**
	 * Test AI extensions ARE disabled on Media Library.
	 */
	public function test_ai_extensions_disabled_on_media_library() {
		$this->enable_image_studio();
		$this->make_ai_extensions_available();

		$this->set_media_library_screen();
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be disabled on Media Library."
			);
		}
	}

	/**
	 * Test AI extensions are NOT disabled on non-editor, non-media screen.
	 */
	public function test_ai_extensions_not_disabled_on_dashboard() {
		$this->enable_image_studio();
		$this->make_ai_extensions_available();

		set_current_screen( 'dashboard' );
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertTrue(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should stay available on dashboard."
			);
		}
	}

	/**
	 * Test AI extensions blanket-disabled when no screen is available.
	 *
	 * On the first call (during module load), get_current_screen() is not
	 * available, so we blanket disable as a safe default.
	 */
	public function test_ai_extensions_blanket_disabled_when_no_screen() {
		$this->enable_image_studio();
		$this->make_ai_extensions_available();

		$GLOBALS['current_screen'] = null;
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be disabled when no screen is available (blanket disable)."
			);
		}
	}

	// -------------------------------------------------------------------------
	// get_asset_data_from_file() tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_asset_data_from_file returns false when file does not exist.
	 */
	public function test_get_asset_data_from_file_returns_false_when_file_missing() {
		$result = ImageStudio\get_asset_data_from_file();
		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_file reads valid JSON from local file.
	 */
	public function test_get_asset_data_from_file_reads_valid_json() {
		$asset_data = array(
			'version'      => '5.0.0',
			'dependencies' => array( 'wp-element' ),
		);
		$local_path = ABSPATH . ImageStudio\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		// Create directory and file.
		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, wp_json_encode( $asset_data, JSON_UNESCAPED_SLASHES ) );

		$result = ImageStudio\get_asset_data_from_file();

		// Clean up.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data_from_file returns false when file contains invalid JSON.
	 */
	public function test_get_asset_data_from_file_returns_false_on_invalid_json() {
		$local_path = ABSPATH . ImageStudio\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, 'not valid json{{{' );

		$result = ImageStudio\get_asset_data_from_file();

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_file returns false when file contains a JSON string instead of array.
	 */
	public function test_get_asset_data_from_file_returns_false_on_json_string() {
		$local_path = ABSPATH . ImageStudio\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, '"just a string"' );

		$result = ImageStudio\get_asset_data_from_file();

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data prefers local file over remote fetch.
	 */
	public function test_get_asset_data_prefers_local_file_over_remote() {
		$local_data  = array(
			'version'      => 'local-1.0.0',
			'dependencies' => array(),
		);
		$remote_data = array(
			'version'      => 'remote-2.0.0',
			'dependencies' => array(),
		);

		$local_path = ABSPATH . ImageStudio\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, wp_json_encode( $local_data, JSON_UNESCAPED_SLASHES ) );

		$this->mock_remote_asset( $remote_data );

		$result = ImageStudio\get_asset_data();

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertEquals( $local_data, $result );
	}

	/**
	 * Test get_asset_data falls back to remote when local file is missing.
	 */
	public function test_get_asset_data_falls_back_to_remote_when_no_local_file() {
		$remote_data = array(
			'version'      => 'remote-3.0.0',
			'dependencies' => array( 'wp-plugins' ),
		);

		$this->mock_remote_asset( $remote_data );

		$result = ImageStudio\get_asset_data();

		$this->assertEquals( $remote_data, $result );
	}

	// -------------------------------------------------------------------------
	// get_asset_data_from_remote() tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_asset_data_from_remote returns valid asset data on success.
	 */
	public function test_get_asset_data_from_remote_returns_data_on_success() {
		$asset_data = array(
			'version'      => '6.0.0',
			'dependencies' => array( 'wp-element', 'wp-plugins' ),
		);
		$this->mock_remote_asset( $asset_data );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on WP_Error.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_wp_error() {
		$this->mock_remote_asset( false );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on non-200 status code.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_non_200() {
		$this->mock_remote_asset_with_status( 500, 'Internal Server Error' );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on 404 status code.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_404() {
		$this->mock_remote_asset_with_status( 404, 'Not Found' );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on invalid JSON body.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not valid json{{{' );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on JSON string body.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_json_string() {
		$this->mock_remote_asset_with_status( 200, '"just a string"' );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on non-JSON content type.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_non_json_content_type() {
		$this->mock_remote_asset_with_status( 200, '<html>Not JSON</html>', 'text/html' );

		$result = ImageStudio\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	// -------------------------------------------------------------------------
	// get_ai_image_extensions() tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_ai_image_extensions returns all expected extensions.
	 */
	public function test_get_ai_image_extensions_returns_expected_list() {
		$extensions = ImageStudio\get_ai_image_extensions();
		$this->assertEquals( self::get_ai_image_extensions(), $extensions );
	}

	// -------------------------------------------------------------------------
	// Headless agent loading tests
	// -------------------------------------------------------------------------

	/**
	 * Test that agents_manager_agent_providers includes Image Studio provider
	 * when jetpack_image_studio_enabled is true.
	 */
	public function test_agent_providers_includes_image_studio_when_enabled() {
		$this->enable_image_studio();

		$providers = ImageStudio\register_headless_agent_provider( array() );

		$this->assertContains( ImageStudio\HEADLESS_AGENT_PROVIDER, $providers );
	}

	/**
	 * Test that agents_manager_agent_providers does NOT include Image Studio
	 * provider when jetpack_image_studio_enabled is false.
	 */
	public function test_agent_providers_excludes_image_studio_when_disabled() {
		$this->disable_image_studio();

		$providers = ImageStudio\register_headless_agent_provider( array() );

		$this->assertNotContains( ImageStudio\HEADLESS_AGENT_PROVIDER, $providers );
	}

	/**
	 * Test that agents_manager_agent_providers does NOT include Image Studio
	 * provider when no filter is set (default false).
	 */
	public function test_agent_providers_excludes_image_studio_by_default() {
		$providers = ImageStudio\register_headless_agent_provider( array() );

		$this->assertNotContains( ImageStudio\HEADLESS_AGENT_PROVIDER, $providers );
	}

	/**
	 * Test that register_headless_agent_provider preserves existing providers.
	 */
	public function test_agent_providers_preserves_existing_providers() {
		$this->enable_image_studio();

		$existing  = array( 'some-other/provider' );
		$providers = ImageStudio\register_headless_agent_provider( $existing );

		$this->assertContains( 'some-other/provider', $providers );
		$this->assertContains( ImageStudio\HEADLESS_AGENT_PROVIDER, $providers );
	}

	/**
	 * Test that enable_agents_manager_for_image_studio returns true
	 * when jetpack_image_studio_enabled is true.
	 */
	public function test_enable_agents_manager_returns_true_when_image_studio_enabled() {
		$this->enable_image_studio();

		$result = ImageStudio\enable_agents_manager_for_image_studio( false );

		$this->assertTrue( $result );
	}

	/**
	 * Test that enable_agents_manager_for_image_studio returns false
	 * when jetpack_image_studio_enabled is false and input is false.
	 */
	public function test_enable_agents_manager_returns_false_when_image_studio_disabled() {
		$this->disable_image_studio();

		$result = ImageStudio\enable_agents_manager_for_image_studio( false );

		$this->assertFalse( $result );
	}

	/**
	 * Test that enable_agents_manager_for_image_studio does not override
	 * when agents_manager_use_unified_experience is already true.
	 */
	public function test_enable_agents_manager_preserves_existing_true() {
		// Even without image studio enabled, if already true, stay true.
		$result = ImageStudio\enable_agents_manager_for_image_studio( true );

		$this->assertTrue( $result );
	}

	/**
	 * Test that enable_agents_manager_for_image_studio preserves true
	 * when both unified experience and image studio are enabled (no double-registration).
	 */
	public function test_enable_agents_manager_no_double_registration() {
		$this->enable_image_studio();

		// Already true — should return early without re-evaluating jetpack_image_studio_enabled.
		$result = ImageStudio\enable_agents_manager_for_image_studio( true );

		$this->assertTrue( $result );
	}

	/**
	 * Test HEADLESS_AGENT_PROVIDER constant value.
	 */
	public function test_headless_agent_provider_constant() {
		$this->assertEquals( 'image-studio/headless-agent-provider', ImageStudio\HEADLESS_AGENT_PROVIDER );
	}

	// -------------------------------------------------------------------------
	// Constants tests
	// -------------------------------------------------------------------------

	/**
	 * Test that the feature name constant is defined correctly.
	 */
	public function test_feature_name_constant() {
		$this->assertEquals( 'image-studio', ImageStudio\FEATURE_NAME );
	}

	/**
	 * Test that ASSET_BASE_PATH is defined correctly.
	 */
	public function test_asset_base_path_constant() {
		$this->assertEquals( 'widgets.wp.com/agents-manager/', ImageStudio\ASSET_BASE_PATH );
	}

	/**
	 * Test that ASSET_JSON_PATH is defined correctly.
	 */
	public function test_asset_json_path_constant() {
		$this->assertEquals( 'widgets.wp.com/agents-manager/image-studio.asset.json', ImageStudio\ASSET_JSON_PATH );
	}

	/**
	 * Test that asset URLs point to the expected base URL.
	 */
	public function test_asset_urls_use_expected_base() {
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', ImageStudio\ASSET_JS_URL );
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', ImageStudio\ASSET_CSS_URL );
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', ImageStudio\ASSET_RTL_URL );
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', ImageStudio\ASSET_JSON_URL );
	}

	/**
	 * Test that JS URL contains .min but CSS URLs do not.
	 */
	public function test_js_url_has_min_css_urls_do_not() {
		$this->assertStringContainsString( '.min.js', ImageStudio\ASSET_JS_URL );
		$this->assertStringNotContainsString( '.min', ImageStudio\ASSET_CSS_URL );
		$this->assertStringNotContainsString( '.min', ImageStudio\ASSET_RTL_URL );
	}

	/**
	 * Test that the asset transient constant is defined correctly.
	 */
	public function test_asset_transient_constant() {
		$this->assertEquals( 'jetpack_image_studio_asset', ImageStudio\ASSET_TRANSIENT );
	}
}
