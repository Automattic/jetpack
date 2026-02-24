<?php
/**
 * Block Notes extension tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\BlockNotes;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/block-notes/block-notes.php';

/**
 * Block Notes extension tests.
 */
class Block_Notes_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_transient( BlockNotes\ASSET_TRANSIENT );
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();
		$this->reset_availability();
		$this->saved_screen = $GLOBALS['current_screen'] ?? null;
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( BlockNotes\ASSET_TRANSIENT );
		remove_all_filters( 'jetpack_block_notes_enabled' );
		remove_all_filters( 'agents_manager_use_unified_experience' );
		remove_all_filters( 'pre_http_request' );
		$GLOBALS['current_screen'] = $this->saved_screen;
		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
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
	 * Enable Block Notes via jetpack_block_notes_enabled filter.
	 */
	private function enable_block_notes() {
		add_filter( 'jetpack_block_notes_enabled', '__return_true' );
	}

	/**
	 * Disable Block Notes via filter.
	 */
	private function disable_block_notes() {
		add_filter( 'jetpack_block_notes_enabled', '__return_false' );
	}

	/**
	 * Enable unified chat experience filter.
	 */
	private function enable_unified_experience() {
		add_filter( 'agents_manager_use_unified_experience', '__return_true' );
	}

	/**
	 * Set the current screen to the post editor for post type 'post'.
	 */
	private function set_post_editor_screen() {
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor = true;
	}

	/**
	 * Set the current screen to the post editor for post type 'page'.
	 */
	private function set_page_editor_screen() {
		set_current_screen( 'page' );
		get_current_screen()->is_block_editor = true;
	}

	/**
	 * Enable Block Notes, cache asset data, and enqueue via block editor path.
	 *
	 * Sets up post editor screen before enqueuing.
	 *
	 * @param array|null $asset_data The asset data to cache.
	 */
	private function enable_and_enqueue_post_editor( $asset_data = null ) {
		if ( null === $asset_data ) {
			$asset_data = array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			);
		}
		$this->enable_block_notes();
		$this->set_post_editor_screen();
		BlockNotes\register_plugin();
		set_transient( BlockNotes\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );
		BlockNotes\enqueue_block_notes();
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
	// is_block_notes_enabled() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_block_notes_enabled returns true when jetpack_block_notes_enabled is true.
	 */
	public function test_is_enabled_via_jetpack_filter() {
		$this->enable_block_notes();
		$this->assertTrue( BlockNotes\is_block_notes_enabled() );
	}

	/**
	 * Test is_block_notes_enabled returns true when unified experience is true.
	 */
	public function test_is_enabled_via_unified_experience() {
		$this->enable_unified_experience();
		$this->assertTrue( BlockNotes\is_block_notes_enabled() );
	}

	/**
	 * Test is_block_notes_enabled returns false when both filters are false.
	 */
	public function test_is_not_enabled_when_both_filters_false() {
		$this->assertFalse( BlockNotes\is_block_notes_enabled() );
	}

	/**
	 * Test is_block_notes_enabled returns true when both filters are true.
	 */
	public function test_is_enabled_when_both_filters_true() {
		$this->enable_block_notes();
		$this->enable_unified_experience();
		$this->assertTrue( BlockNotes\is_block_notes_enabled() );
	}

	// -------------------------------------------------------------------------
	// is_post_editor() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_post_editor returns true on post editor with post type 'post'.
	 */
	public function test_is_post_editor_true() {
		$this->set_post_editor_screen();
		$this->assertTrue( BlockNotes\is_post_editor() );
	}

	/**
	 * Test is_post_editor returns false on post editor with post type 'page'.
	 */
	public function test_is_post_editor_false_for_page_post_type() {
		$this->set_page_editor_screen();
		$this->assertFalse( BlockNotes\is_post_editor() );
	}

	/**
	 * Test is_post_editor returns false on Media Library screen.
	 */
	public function test_is_post_editor_false_on_media_library() {
		set_current_screen( 'upload' );
		$this->assertFalse( BlockNotes\is_post_editor() );
	}

	/**
	 * Test is_post_editor returns false on dashboard.
	 */
	public function test_is_post_editor_false_on_dashboard() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( BlockNotes\is_post_editor() );
	}

	/**
	 * Test is_post_editor returns false when no current screen is set.
	 */
	public function test_is_post_editor_false_when_no_screen() {
		$GLOBALS['current_screen'] = null;
		$this->assertFalse( BlockNotes\is_post_editor() );
	}

	// -------------------------------------------------------------------------
	// should_load_on_current_screen() tests
	// -------------------------------------------------------------------------

	/**
	 * Test should_load_on_current_screen returns true on post editor with post type 'post'.
	 */
	public function test_should_load_on_post_editor() {
		$this->set_post_editor_screen();
		$this->assertTrue( BlockNotes\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false on page editor.
	 */
	public function test_should_not_load_on_page_editor() {
		$this->set_page_editor_screen();
		$this->assertFalse( BlockNotes\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false on Media Library.
	 */
	public function test_should_not_load_on_media_library() {
		set_current_screen( 'upload' );
		$this->assertFalse( BlockNotes\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false on dashboard.
	 */
	public function test_should_not_load_on_dashboard() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( BlockNotes\should_load_on_current_screen() );
	}

	/**
	 * Test should_load_on_current_screen returns false when no screen is set.
	 */
	public function test_should_not_load_when_no_screen() {
		$GLOBALS['current_screen'] = null;
		$this->assertFalse( BlockNotes\should_load_on_current_screen() );
	}

	// -------------------------------------------------------------------------
	// register_plugin() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that register_plugin sets extension available when jetpack_block_notes_enabled is true.
	 */
	public function test_register_plugin_sets_available_when_enabled() {
		$this->enable_block_notes();
		BlockNotes\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( BlockNotes\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin sets extension available when unified experience is true.
	 */
	public function test_register_plugin_sets_available_when_unified_experience() {
		$this->enable_unified_experience();
		BlockNotes\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( BlockNotes\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin does not set extension available when both filters are false.
	 */
	public function test_register_plugin_not_available_when_disabled() {
		$this->disable_block_notes();
		BlockNotes\register_plugin();
		$this->assertFalse( \Jetpack_Gutenberg::is_available( BlockNotes\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin registers unconditionally regardless of screen.
	 *
	 * Screen-level gating happens at enqueue time, not registration.
	 */
	public function test_register_plugin_available_regardless_of_screen() {
		$this->enable_block_notes();

		// Post editor - still registers.
		$this->set_post_editor_screen();
		BlockNotes\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( BlockNotes\FEATURE_NAME ) );

		$this->reset_availability();

		// Dashboard - still registers.
		set_current_screen( 'dashboard' );
		BlockNotes\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( BlockNotes\FEATURE_NAME ) );
	}

	// -------------------------------------------------------------------------
	// enqueue_block_notes() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that script is enqueued in post editor.
	 */
	public function test_post_editor_script_enqueued_with_dependencies() {
		$this->enable_and_enqueue_post_editor(
			array(
				'version'      => '1.2.3',
				'dependencies' => array( 'wp-element', 'wp-plugins' ),
			)
		);

		$this->assertTrue( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );

		$script = $GLOBALS['wp_scripts']->registered[ BlockNotes\FEATURE_NAME ];
		$this->assertContains( 'wp-element', $script->deps );
		$this->assertContains( 'wp-plugins', $script->deps );
	}

	/**
	 * Test nothing enqueued when not on post editor screen.
	 */
	public function test_nothing_enqueued_on_dashboard() {
		$this->enable_block_notes();
		set_current_screen( 'dashboard' );
		BlockNotes\register_plugin();
		set_transient(
			BlockNotes\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);
		BlockNotes\enqueue_block_notes();

		$this->assertFalse( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test nothing enqueued on page editor (post type != 'post').
	 */
	public function test_nothing_enqueued_on_page_editor() {
		$this->enable_block_notes();
		$this->set_page_editor_screen();
		BlockNotes\register_plugin();
		set_transient(
			BlockNotes\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);
		BlockNotes\enqueue_block_notes();

		$this->assertFalse( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test inline script sets blockNotesData with enabled true.
	 */
	public function test_inline_script_sets_block_notes_data() {
		$this->enable_and_enqueue_post_editor();

		$inline = $GLOBALS['wp_scripts']->get_data( BlockNotes\FEATURE_NAME, 'before' );

		$this->assertIsArray( $inline );
		$found = false;
		foreach ( $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'blockNotesData' ) !== false ) {
				$found = true;
				$this->assertStringContainsString( '"enabled":true', $line );
			}
		}
		$this->assertTrue( $found, 'Inline script with blockNotesData not found.' );
	}

	/**
	 * Test nothing enqueued when asset file is unavailable.
	 */
	public function test_nothing_enqueued_when_asset_unavailable() {
		$this->enable_block_notes();
		$this->set_post_editor_screen();
		BlockNotes\register_plugin();
		$this->mock_remote_asset( false );

		BlockNotes\enqueue_block_notes();

		$this->assertFalse( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test version from asset file is used for script.
	 */
	public function test_version_from_asset_file() {
		$this->enable_and_enqueue_post_editor(
			array(
				'version'      => '4.5.6',
				'dependencies' => array(),
			)
		);

		$script = $GLOBALS['wp_scripts']->registered[ BlockNotes\FEATURE_NAME ];
		$this->assertEquals( '4.5.6', $script->ver );
	}

	/**
	 * Test nothing enqueued when Block Notes is disabled.
	 */
	public function test_nothing_enqueued_when_extension_not_available() {
		$this->disable_block_notes();
		$this->set_post_editor_screen();
		BlockNotes\register_plugin();
		set_transient(
			BlockNotes\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);
		BlockNotes\enqueue_block_notes();

		$this->assertFalse( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Test script URL points to widgets.wp.com.
	 */
	public function test_script_url_points_to_widgets() {
		$this->enable_and_enqueue_post_editor();

		$script = $GLOBALS['wp_scripts']->registered[ BlockNotes\FEATURE_NAME ];
		$this->assertStringContainsString( 'widgets.wp.com', $script->src );
		$this->assertStringContainsString( 'block-notes.min.js', $script->src );
	}

	/**
	 * Test enqueue works with empty dependencies array.
	 */
	public function test_enqueue_with_empty_dependencies() {
		$this->enable_and_enqueue_post_editor(
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			)
		);

		$this->assertTrue( wp_script_is( BlockNotes\FEATURE_NAME, 'enqueued' ) );
		$script = $GLOBALS['wp_scripts']->registered[ BlockNotes\FEATURE_NAME ];
		$this->assertEmpty( $script->deps );
	}

	/**
	 * Test script is loaded in footer.
	 */
	public function test_script_loaded_in_footer() {
		$this->enable_and_enqueue_post_editor();

		$script = $GLOBALS['wp_scripts']->registered[ BlockNotes\FEATURE_NAME ];
		$this->assertSame( 1, $script->extra['group'] );
	}

	// -------------------------------------------------------------------------
	// get_asset_data() tests
	// -------------------------------------------------------------------------

	/**
	 * Test transient caching of asset data after fetch.
	 */
	public function test_transient_caching_after_fetch() {
		$asset_data = array(
			'version'      => '2.0.0',
			'dependencies' => array( 'wp-element' ),
		);
		$this->mock_remote_asset( $asset_data );

		$result = BlockNotes\get_asset_data();

		$this->assertEquals( $asset_data, $result );

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$this->assertFalse( get_transient( BlockNotes\ASSET_TRANSIENT ) );
		} else {
			$this->assertEquals( $asset_data, get_transient( BlockNotes\ASSET_TRANSIENT ) );
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
		set_transient( BlockNotes\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );

		$this->mock_remote_asset( false );

		$result = BlockNotes\get_asset_data();

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data returns false on WP_Error.
	 */
	public function test_get_asset_data_returns_false_on_wp_error() {
		$this->mock_remote_asset( false );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false on non-200 HTTP status code.
	 */
	public function test_get_asset_data_returns_false_on_non_200_status() {
		$this->mock_remote_asset_with_status( 500, 'Internal Server Error' );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false on 404 HTTP status code.
	 */
	public function test_get_asset_data_returns_false_on_404_status() {
		$this->mock_remote_asset_with_status( 404, 'Not Found' );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false when response body is invalid JSON.
	 */
	public function test_get_asset_data_returns_false_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not valid json{{{' );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data returns false when response body is a JSON string instead of array.
	 */
	public function test_get_asset_data_returns_false_on_json_string() {
		$this->mock_remote_asset_with_status( 200, '"just a string"' );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data does not set transient when fetch fails.
	 */
	public function test_get_asset_data_no_transient_on_failure() {
		$this->mock_remote_asset( false );

		BlockNotes\get_asset_data();

		$this->assertFalse( get_transient( BlockNotes\ASSET_TRANSIENT ) );
	}

	/**
	 * Test get_asset_data does not set transient when JSON is invalid.
	 */
	public function test_get_asset_data_no_transient_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not json' );

		BlockNotes\get_asset_data();

		$this->assertFalse( get_transient( BlockNotes\ASSET_TRANSIENT ) );
	}

	/**
	 * Test get_asset_data returns false when Content-Type is not JSON.
	 */
	public function test_get_asset_data_returns_false_on_non_json_content_type() {
		$this->mock_remote_asset_with_status( 200, '<html>Not JSON</html>', 'text/html' );

		$result = BlockNotes\get_asset_data();

		$this->assertFalse( $result );
	}

	// -------------------------------------------------------------------------
	// get_asset_data_from_file() tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_asset_data_from_file returns false when file does not exist.
	 */
	public function test_get_asset_data_from_file_returns_false_when_file_missing() {
		$result = BlockNotes\get_asset_data_from_file();
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
		$local_path = ABSPATH . BlockNotes\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, wp_json_encode( $asset_data, JSON_UNESCAPED_SLASHES ) );

		$result = BlockNotes\get_asset_data_from_file();

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data_from_file returns false when file contains invalid JSON.
	 */
	public function test_get_asset_data_from_file_returns_false_on_invalid_json() {
		$local_path = ABSPATH . BlockNotes\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, 'not valid json{{{' );

		$result = BlockNotes\get_asset_data_from_file();

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $local_path );

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_file returns false when file contains a JSON string instead of array.
	 */
	public function test_get_asset_data_from_file_returns_false_on_json_string() {
		$local_path = ABSPATH . BlockNotes\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, '"just a string"' );

		$result = BlockNotes\get_asset_data_from_file();

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

		$local_path = ABSPATH . BlockNotes\ASSET_JSON_PATH;
		$dir        = dirname( $local_path );

		wp_mkdir_p( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $local_path, wp_json_encode( $local_data, JSON_UNESCAPED_SLASHES ) );

		$this->mock_remote_asset( $remote_data );

		$result = BlockNotes\get_asset_data();

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

		$result = BlockNotes\get_asset_data();

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

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertEquals( $asset_data, $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on WP_Error.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_wp_error() {
		$this->mock_remote_asset( false );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on non-200 status code.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_non_200() {
		$this->mock_remote_asset_with_status( 500, 'Internal Server Error' );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on 404 status code.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_404() {
		$this->mock_remote_asset_with_status( 404, 'Not Found' );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on invalid JSON body.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_invalid_json() {
		$this->mock_remote_asset_with_status( 200, 'not valid json{{{' );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on JSON string body.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_json_string() {
		$this->mock_remote_asset_with_status( 200, '"just a string"' );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_asset_data_from_remote returns false on non-JSON content type.
	 */
	public function test_get_asset_data_from_remote_returns_false_on_non_json_content_type() {
		$this->mock_remote_asset_with_status( 200, '<html>Not JSON</html>', 'text/html' );

		$result = BlockNotes\get_asset_data_from_remote();

		$this->assertFalse( $result );
	}

	// -------------------------------------------------------------------------
	// enable_agents_manager_for_block_notes() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that enable_agents_manager_for_block_notes returns true
	 * when jetpack_block_notes_enabled is true.
	 */
	public function test_enable_agents_manager_returns_true_when_block_notes_enabled() {
		$this->enable_block_notes();

		$result = BlockNotes\enable_agents_manager_for_block_notes( false );

		$this->assertTrue( $result );
	}

	/**
	 * Test that enable_agents_manager_for_block_notes returns false
	 * when jetpack_block_notes_enabled is false and input is false.
	 */
	public function test_enable_agents_manager_returns_false_when_block_notes_disabled() {
		$this->disable_block_notes();

		$result = BlockNotes\enable_agents_manager_for_block_notes( false );

		$this->assertFalse( $result );
	}

	/**
	 * Test that enable_agents_manager_for_block_notes does not override
	 * when agents_manager_use_unified_experience is already true.
	 */
	public function test_enable_agents_manager_preserves_existing_true() {
		$result = BlockNotes\enable_agents_manager_for_block_notes( true );

		$this->assertTrue( $result );
	}

	/**
	 * Test that enable_agents_manager_for_block_notes preserves true
	 * when both unified experience and block notes are enabled.
	 */
	public function test_enable_agents_manager_no_double_registration() {
		$this->enable_block_notes();

		$result = BlockNotes\enable_agents_manager_for_block_notes( true );

		$this->assertTrue( $result );
	}

	// -------------------------------------------------------------------------
	// register_meta_fields() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that register_meta_fields registers the bigsky_ai_processed_date comment meta.
	 */
	public function test_register_meta_fields_registers_comment_meta() {
		BlockNotes\register_meta_fields();

		$registered = get_registered_meta_keys( 'comment' );

		$this->assertArrayHasKey( 'bigsky_ai_processed_date', $registered );

		$meta = $registered['bigsky_ai_processed_date'];
		$this->assertEquals( 'string', $meta['type'] );
		$this->assertTrue( $meta['single'] );
		$this->assertTrue( $meta['show_in_rest'] );
	}

	// -------------------------------------------------------------------------
	// customize_ai_avatar() tests
	// -------------------------------------------------------------------------

	/**
	 * Test customize_ai_avatar replaces URL for AI-authored notes.
	 */
	public function test_customize_ai_avatar_replaces_url_for_ai_author() {
		$comment                 = new stdClass();
		$comment->comment_author = 'AI [experimental]';

		$args = BlockNotes\customize_ai_avatar( array( 'url' => 'https://example.com/default.jpg' ), $comment );

		$this->assertStringContainsString( '.svg', $args['url'] );
		$this->assertNotEquals( 'https://example.com/default.jpg', $args['url'] );
	}

	/**
	 * Test customize_ai_avatar does not modify URL for non-AI authors.
	 */
	public function test_customize_ai_avatar_leaves_url_for_other_authors() {
		$comment                 = new stdClass();
		$comment->comment_author = 'John Doe';

		$original_url = 'https://example.com/default.jpg';
		$args         = BlockNotes\customize_ai_avatar( array( 'url' => $original_url ), $comment );

		$this->assertEquals( $original_url, $args['url'] );
	}

	/**
	 * Test customize_ai_avatar does not modify args for non-comment objects.
	 */
	public function test_customize_ai_avatar_leaves_non_comment_objects_unchanged() {
		$original_url = 'https://example.com/default.jpg';
		$args         = BlockNotes\customize_ai_avatar( array( 'url' => $original_url ), 42 );

		$this->assertEquals( $original_url, $args['url'] );
	}

	// -------------------------------------------------------------------------
	// Constants tests
	// -------------------------------------------------------------------------

	/**
	 * Test that the feature name constant is defined correctly.
	 */
	public function test_feature_name_constant() {
		$this->assertEquals( 'block-notes', BlockNotes\FEATURE_NAME );
	}

	/**
	 * Test that ASSET_BASE_PATH is defined correctly.
	 */
	public function test_asset_base_path_constant() {
		$this->assertEquals( 'widgets.wp.com/agents-manager/', BlockNotes\ASSET_BASE_PATH );
	}

	/**
	 * Test that ASSET_JSON_PATH is defined correctly.
	 */
	public function test_asset_json_path_constant() {
		$this->assertEquals( 'widgets.wp.com/agents-manager/block-notes.asset.json', BlockNotes\ASSET_JSON_PATH );
	}

	/**
	 * Test that asset URLs point to the expected base URL.
	 */
	public function test_asset_urls_use_expected_base() {
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', BlockNotes\ASSET_JS_URL );
		$this->assertStringStartsWith( 'https://widgets.wp.com/agents-manager/', BlockNotes\ASSET_JSON_URL );
	}

	/**
	 * Test that JS URL contains .min.js.
	 */
	public function test_js_url_has_min() {
		$this->assertStringContainsString( '.min.js', BlockNotes\ASSET_JS_URL );
	}

	/**
	 * Test that the asset transient constant is defined correctly.
	 */
	public function test_asset_transient_constant() {
		$this->assertEquals( 'jetpack_block_notes_asset', BlockNotes\ASSET_TRANSIENT );
	}
}
