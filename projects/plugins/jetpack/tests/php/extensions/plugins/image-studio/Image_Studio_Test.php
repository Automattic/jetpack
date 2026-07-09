<?php
/**
 * Image Studio extension tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\ImageStudio;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';
require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-assistant-plugin/ai-assistant-plugin.php';

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
	 * Saved siteurl option for restoration in tear_down.
	 *
	 * @var string
	 */
	private $saved_siteurl;

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
		$this->simulate_connected_owner();
		// Ensure Big Sky is disabled by default so tests aren't affected by the
		// Big_Sky class persisting across tests once simulate_big_sky_class() runs.
		update_option( 'big_sky_enable', '0' );
		$this->saved_screen  = $GLOBALS['current_screen'] ?? null;
		$this->saved_siteurl = get_option( 'siteurl' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( ImageStudio\ASSET_TRANSIENT );
		remove_all_filters( 'jetpack_image_studio_enabled' );
		remove_all_filters( 'jetpack_image_studio_can_generate_video_clips' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'locale' );
		remove_all_filters( 'jetpack_ai_enabled' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		delete_option( 'big_sky_enable' );
		update_option( 'siteurl', $this->saved_siteurl );
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
	 * Simulate a connected Jetpack owner so has_jetpack_ai_features() returns true.
	 *
	 * Called in set_up() so every test starts with AI features available and the
	 * current user connected (Image Studio gates on the current user's own
	 * connection). Tests that need AI features off should use disable_ai_features(),
	 * and tests that need a non-connected or different current user should override
	 * with wp_set_current_user().
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		wp_set_current_user( $user_id );
	}

	/**
	 * Disable AI features via the jetpack_ai_enabled kill switch.
	 */
	private function disable_ai_features() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );
	}

	/**
	 * Simulate the Big_Sky class existing (as if the Big Sky plugin were active).
	 *
	 * The class is declared in the global namespace once and persists for the
	 * rest of the PHP process, but test isolation is achieved through the
	 * big_sky_enable option, which is cleaned up in tear_down().
	 */
	private function simulate_big_sky_class() {
		if ( ! class_exists( 'Big_Sky' ) ) {
			eval( 'class Big_Sky {}' ); // @codingStandardsIgnoreLine — minimal stub for unit test isolation.
		}
	}

	/**
	 * Enable Big Sky by simulating the class and setting the option.
	 */
	private function enable_big_sky() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '1' );
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
	 * Cache asset data, set block editor screen, register plugin, and enqueue.
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
		$this->enable_big_sky();
		$this->set_block_editor_screen();
		ImageStudio\register_plugin();
		set_transient( ImageStudio\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );
		ImageStudio\enqueue_image_studio();
	}

	/**
	 * Cache asset data, set Media Library screen, register plugin, and enqueue.
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
		$this->enable_big_sky();
		$this->set_media_library_screen();
		ImageStudio\register_plugin();
		set_transient( ImageStudio\ASSET_TRANSIENT, $asset_data, HOUR_IN_SECONDS );
		ImageStudio\enqueue_image_studio_admin();
	}

	/**
	 * Get Image Studio inline script data.
	 *
	 * @return array|null The decoded imageStudioData array, or null if missing.
	 */
	private function get_image_studio_inline_data() {
		$inline = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );

		if ( ! is_array( $inline ) ) {
			return null;
		}

		foreach ( $inline as $line ) {
			if ( ! is_string( $line ) || false === strpos( $line, 'imageStudioData' ) ) {
				continue;
			}

			$matches = array();
			if ( preg_match( '/window\.imageStudioData = (\{.*\}); \}$/', $line, $matches ) ) {
				$data = json_decode( $matches[1], true );
				return is_array( $data ) ? $data : null;
			}
		}

		return null;
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
	private function mock_remote_asset_with_status( $status_code, $body, $content_type = 'application/json' ) {
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
	// has_jetpack_ai_features() tests
	// -------------------------------------------------------------------------

	/**
	 * AI features available by default in the test environment.
	 */
	public function test_has_jetpack_ai_features_true_by_default() {
		$this->assertTrue( ImageStudio\has_jetpack_ai_features() );
	}

	/**
	 * AI features disabled via jetpack_ai_enabled kill switch.
	 */
	public function test_has_jetpack_ai_features_false_when_ai_disabled() {
		$this->disable_ai_features();
		$this->assertFalse( ImageStudio\has_jetpack_ai_features() );
	}

	// -------------------------------------------------------------------------
	// is_image_studio_enabled() tests
	// -------------------------------------------------------------------------

	/**
	 * Not enabled when AI features are disabled and no Big Sky/CIAB override.
	 */
	public function test_is_not_enabled_when_ai_features_disabled() {
		$this->disable_ai_features();
		$this->assertFalse( ImageStudio\is_image_studio_enabled() );
	}

	/**
	 * Site-level enablement stays true even when the current user is not
	 * connected. It drives the Big Sky stand-down signal and the suppression of
	 * the legacy AI image extensions, so it must not depend on the visitor;
	 * per-user gating happens at asset-load time instead.
	 */
	public function test_is_enabled_at_site_level_regardless_of_user_connection() {
		$non_connected_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $non_connected_admin );

		$this->assertTrue( ImageStudio\is_image_studio_enabled() );
		$this->assertFalse( ImageStudio\is_current_user_connected() );
	}

	/**
	 * Editor assets are not enqueued for a user who has not connected their own
	 * WordPress.com account, even though the site offers Image Studio.
	 */
	public function test_assets_not_enqueued_when_current_user_not_connected() {
		$this->enable_big_sky();
		$this->set_block_editor_screen();
		set_transient(
			ImageStudio\ASSET_TRANSIENT,
			array(
				'version'      => '1.0.0',
				'dependencies' => array(),
			),
			HOUR_IN_SECONDS
		);

		$non_connected_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $non_connected_admin );

		ImageStudio\enqueue_image_studio();

		$this->assertFalse( wp_script_is( ImageStudio\FEATURE_NAME, 'enqueued' ) );
	}

	/**
	 * Editor assets are enqueued when the current user is connected.
	 */
	public function test_assets_enqueued_when_current_user_connected() {
		// set_up() connects an owner and acts as them.
		$this->enable_big_sky();
		$this->set_block_editor_screen();
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
	}

	// -------------------------------------------------------------------------
	// signal_image_studio_active() tests
	// -------------------------------------------------------------------------

	/**
	 * Test signal_image_studio_active adds the jetpack_image_studio_enabled filter when enabled.
	 */
	public function test_signal_adds_filter_when_enabled() {
		$this->enable_big_sky();
		ImageStudio\signal_image_studio_active();
		$this->assertTrue( apply_filters( 'jetpack_image_studio_enabled', false ) );
	}

	/**
	 * Test signal_image_studio_active does NOT add filter when AI features are disabled.
	 */
	public function test_signal_does_not_add_filter_when_disabled() {
		$this->disable_ai_features();
		ImageStudio\signal_image_studio_active();
		$this->assertFalse( apply_filters( 'jetpack_image_studio_enabled', false ) );
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
	// register_plugin() tests
	// -------------------------------------------------------------------------

	/**
	 * Test that register_plugin sets extension available when enabled via Big Sky.
	 */
	public function test_register_plugin_sets_available_when_enabled() {
		$this->enable_big_sky();
		ImageStudio\register_plugin();
		$this->assertTrue( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin does not set extension available when AI features are disabled.
	 */
	public function test_register_plugin_not_available_when_disabled() {
		$this->disable_ai_features();
		ImageStudio\register_plugin();
		$this->assertFalse( \Jetpack_Gutenberg::is_available( ImageStudio\FEATURE_NAME ) );
	}

	/**
	 * Test that register_plugin registers unconditionally regardless of screen.
	 *
	 * Screen-level gating happens at enqueue time, not registration.
	 */
	public function test_register_plugin_available_regardless_of_screen() {
		$this->enable_big_sky();

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
	 * Test block editor enqueue works without any special query param.
	 */
	public function test_block_editor_enqueued_without_query_param() {
		$this->enable_big_sky();
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
		$this->enable_big_sky();
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
	 * Test inline script sets tracking context data.
	 */
	public function test_inline_script_sets_tracking_context_data() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'asd.qwe.1' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();

		$this->enable_and_enqueue_block_editor();

		$data = $this->get_image_studio_inline_data();

		$this->assertIsArray( $data );
		$this->assertSame( 1234, $data['blogId'] );
		$this->assertSame( 'jetpack', $data['siteType'] );
		$this->assertFalse( $data['isA11n'] );
		$this->assertArrayHasKey( 'isDevMode', $data );
	}

	/**
	 * Test inline script includes canGenerateVideoClips property.
	 */
	public function test_inline_script_includes_can_generate_video_clips() {
		$this->enable_and_enqueue_block_editor();

		$inline = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );

		$this->assertIsArray( $inline );
		$found = false;
		foreach ( $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'imageStudioData' ) !== false ) {
				$found = true;
				$this->assertStringContainsString( '"canGenerateVideoClips":', $line );
			}
		}
		$this->assertTrue( $found, 'Inline script with imageStudioData not found.' );
	}

	/**
	 * Test inline script reflects canGenerateVideoClips = true when forced via filter.
	 *
	 * Runs in a separate process and stubs `wpcom_site_can_upload_videos()` to
	 * return true so the wpcom hard gate is satisfied and the filter's
	 * force-enable path is actually exercised — mirrors the pattern used by
	 * test_can_generate_video_clips_true_when_wpcom_helper_true.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_inline_script_can_generate_video_clips_true_via_filter() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return true; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_true' );
		$this->enable_and_enqueue_block_editor();

		$inline  = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );
		$matched = false;
		foreach ( (array) $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'imageStudioData' ) !== false ) {
				$matched = true;
				$this->assertStringContainsString( '"canGenerateVideoClips":true', $line );
			}
		}
		$this->assertTrue( $matched, 'Inline script with imageStudioData not found.' );
	}

	/**
	 * Test inline script reflects canGenerateVideoClips = false when forced via filter.
	 *
	 * Runs in a separate process and stubs `wpcom_site_can_upload_videos()` to
	 * return true so both hard gates pass — otherwise the wpcom gate could
	 * short-circuit to false and the assertion would succeed without actually
	 * exercising the filter override path.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_inline_script_can_generate_video_clips_false_via_filter() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return true; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_false' );
		$this->enable_and_enqueue_block_editor();

		$inline  = $GLOBALS['wp_scripts']->get_data( ImageStudio\FEATURE_NAME, 'before' );
		$matched = false;
		foreach ( (array) $inline as $line ) {
			if ( is_string( $line ) && strpos( $line, 'imageStudioData' ) !== false ) {
				$matched = true;
				$this->assertStringContainsString( '"canGenerateVideoClips":false', $line );
			}
		}
		$this->assertTrue( $matched, 'Inline script with imageStudioData not found.' );
	}

	/**
	 * Test that image_studio_can_generate_video_clips() honors a filter that
	 * forces the result to false. The filter is consulted between the hard
	 * gates and the default `true`.
	 *
	 * Runs in a separate process and stubs `wpcom_site_can_upload_videos()`
	 * to return true so both hard gates pass — otherwise the wpcom gate
	 * could short-circuit to false and the assertion would succeed without
	 * actually exercising the filter override path.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_filter_override_false() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return true; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_false' );
		$this->assertFalse( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that image_studio_can_generate_video_clips() honors a filter that
	 * forces the result to true once both hard gates pass.
	 *
	 * Runs in a separate process and stubs `wpcom_site_can_upload_videos()` to
	 * return true so the wpcom hard gate is satisfied and the filter's
	 * force-enable path is actually exercised.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_filter_override_true() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return true; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_true' );
		$this->assertTrue( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that the helper returns false when Image Studio itself is not
	 * enabled, regardless of the underlying video-upload capability. Ensures
	 * video clip generation is only surfaced on plans/environments that
	 * already support Image Studio.
	 */
	public function test_can_generate_video_clips_false_when_image_studio_disabled() {
		$this->disable_ai_features();
		$this->assertFalse( ImageStudio\is_image_studio_enabled() );
		$this->assertFalse( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that a stray __return_true on the override filter cannot bypass the
	 * Image Studio enablement gate. The is_image_studio_enabled() check runs
	 * before the filter so accidental usage on unsupported environments still
	 * reports false.
	 */
	public function test_can_generate_video_clips_filter_cannot_override_disabled_image_studio() {
		$this->disable_ai_features();
		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_true' );
		$this->assertFalse( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that a stray __return_true on the override filter cannot bypass the
	 * `wpcom_site_can_upload_videos()` capability check. Both hard gates must
	 * pass before the filter is consulted, so a plan that doesn't support
	 * video uploads always reports false even with the filter forcing true.
	 *
	 * Runs in a separate process so we can stub the global helper without
	 * leaking the definition into the main test process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_filter_cannot_override_no_video_upload() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return false; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		add_filter( 'jetpack_image_studio_can_generate_video_clips', '__return_true' );
		$this->assertFalse( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that the helper returns true when wpcom_site_can_upload_videos() reports true.
	 *
	 * Runs in a separate process so we can stub wpcom_site_can_upload_videos
	 * without leaking the definition into the main test process. Skipped in
	 * environments where the helper is already defined (e.g. WPCOMSH job)
	 * since we cannot redefine an existing function.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_true_when_wpcom_helper_true() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return true; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		$this->assertTrue( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that the helper returns false when wpcom_site_can_upload_videos() reports false.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_false_when_wpcom_helper_false() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos already defined; cannot stub.' );
		}

		eval( 'function wpcom_site_can_upload_videos( $blog_id = 0 ) { return false; }' ); // @codingStandardsIgnoreLine — process-isolated stub.

		$this->assertFalse( ImageStudio\image_studio_can_generate_video_clips() );
	}

	/**
	 * Test that off WPCOM (no wpcom_site_can_upload_videos) the helper returns
	 * true so the entry point is not gated on environments where we have no
	 * way to determine capability up-front. The server is the source of truth
	 * in that case.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_can_generate_video_clips_true_off_wpcom() {
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

		if ( function_exists( 'wpcom_site_can_upload_videos' ) ) {
			$this->markTestSkipped( 'wpcom_site_can_upload_videos defined; cannot exercise off-WPCOM branch.' );
		}

		$this->assertTrue( ImageStudio\image_studio_can_generate_video_clips() );
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
		$this->enable_big_sky();
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
	 * Test nothing enqueued when AI features are disabled.
	 */
	public function test_nothing_enqueued_when_ai_features_disabled() {
		$this->disable_ai_features();
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
		$this->enable_big_sky();
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
	 * Test nothing enqueued on Media Library when AI features are disabled.
	 */
	public function test_media_library_nothing_enqueued_when_disabled() {
		$this->disable_ai_features();
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
	 * Test AI image extensions are disabled when Image Studio is available.
	 */
	public function test_ai_extensions_disabled_when_available() {
		$this->enable_big_sky();
		ImageStudio\register_plugin();
		$this->make_ai_extensions_available();
		$this->set_block_editor_screen();

		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be unavailable when Image Studio is available."
			);
		}
	}

	/**
	 * Test AI image extensions are NOT disabled when Image Studio is not available.
	 */
	public function test_ai_extensions_not_disabled_when_not_available() {
		$this->disable_ai_features();
		ImageStudio\register_plugin();
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
		$this->enable_big_sky();
		ImageStudio\register_plugin();
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
		$this->enable_big_sky();
		ImageStudio\register_plugin();
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
	 * Test AI extensions ARE disabled on dashboard when Image Studio is available.
	 *
	 * AI extensions are disabled globally when Image Studio is available,
	 * regardless of screen.
	 */
	public function test_ai_extensions_disabled_on_dashboard() {
		$this->enable_big_sky();
		ImageStudio\register_plugin();
		$this->make_ai_extensions_available();

		set_current_screen( 'dashboard' );
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be disabled on dashboard when Image Studio is available."
			);
		}
	}

	/**
	 * Test AI extensions ARE disabled when no screen is available.
	 *
	 * AI extensions are disabled globally when Image Studio is available,
	 * regardless of screen availability.
	 */
	public function test_ai_extensions_disabled_when_no_screen() {
		$this->enable_big_sky();
		ImageStudio\register_plugin();
		$this->make_ai_extensions_available();

		$GLOBALS['current_screen'] = null;
		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be disabled when no screen is available."
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
		file_put_contents( $local_path, wp_json_encode( $asset_data, JSON_UNESCAPED_SLASHES ) );

		$result = ImageStudio\get_asset_data_from_file();

		// Clean up.
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
		file_put_contents( $local_path, 'not valid json{{{' );

		$result = ImageStudio\get_asset_data_from_file();

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
		file_put_contents( $local_path, '"just a string"' );

		$result = ImageStudio\get_asset_data_from_file();

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
		file_put_contents( $local_path, wp_json_encode( $local_data, JSON_UNESCAPED_SLASHES ) );

		$this->mock_remote_asset( $remote_data );

		$result = ImageStudio\get_asset_data();

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
	// determine_iso_639_locale() tests
	// -------------------------------------------------------------------------

	/**
	 * Test locale detection returns expected ISO 639 codes.
	 *
	 * @dataProvider provide_locale_mappings
	 *
	 * @param string $wp_locale     The WordPress locale to set.
	 * @param string $expected_code The expected ISO 639 code.
	 */
	#[DataProvider( 'provide_locale_mappings' )]
	public function test_determine_iso_639_locale( $wp_locale, $expected_code ) {
		add_filter(
			'locale',
			function () use ( $wp_locale ) {
				return $wp_locale;
			}
		);

		$this->assertSame( $expected_code, \Automattic\Jetpack\Extensions\Shared\determine_iso_639_locale() );
	}

	/**
	 * Data provider for locale mapping tests.
	 *
	 * Covers: simple strip (fr_FR), compound preserve (pt_BR, zh_TW),
	 * bare code (en), and empty fallback.
	 *
	 * @return array[] [ WordPress locale, expected ISO 639 code ].
	 */
	public static function provide_locale_mappings() {
		return array(
			'simple strip' => array( 'fr_FR', 'fr' ),
			'pt_BR kept'   => array( 'pt_BR', 'pt-br' ),
			'zh_TW kept'   => array( 'zh_TW', 'zh-tw' ),
			'bare code'    => array( 'en', 'en' ),
			'empty'        => array( '', 'en' ),
		);
	}

	// -------------------------------------------------------------------------
	// Translation enqueue tests
	// -------------------------------------------------------------------------

	/**
	 * Test that no translation script is enqueued for English locale.
	 */
	public function test_no_translation_script_for_english() {
		add_filter(
			'locale',
			function () {
				return 'en_US';
			}
		);
		$this->enable_and_enqueue_block_editor();

		$this->assertFalse( wp_script_is( 'agents-manager-translations', 'enqueued' ) );

		$script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertNotContains( 'agents-manager-translations', $script->deps );
	}

	/**
	 * Test that translation script is enqueued for non-English locale
	 * with correct URL and wired as a dependency of the main script.
	 */
	public function test_translation_script_enqueued_for_non_english() {
		add_filter(
			'locale',
			function () {
				return 'fr_FR';
			}
		);
		$this->enable_and_enqueue_block_editor();

		$this->assertTrue( wp_script_is( 'agents-manager-translations', 'enqueued' ) );

		$tr_script = $GLOBALS['wp_scripts']->registered['agents-manager-translations'];
		$this->assertStringContainsString( 'languages/fr-v1.js', $tr_script->src );
		$this->assertContains( 'wp-i18n', $tr_script->deps );

		$main_script = $GLOBALS['wp_scripts']->registered[ ImageStudio\FEATURE_NAME ];
		$this->assertContains( 'agents-manager-translations', $main_script->deps );
	}

	/**
	 * Test that compound locales produce the correct translation URL.
	 */
	public function test_translation_script_url_for_compound_locale() {
		add_filter(
			'locale',
			function () {
				return 'pt_BR';
			}
		);
		$this->enable_and_enqueue_block_editor();

		$script = $GLOBALS['wp_scripts']->registered['agents-manager-translations'];
		$this->assertStringContainsString( 'languages/pt-br-v1.js', $script->src );
	}

	// -------------------------------------------------------------------------
	// add_image_studio_row_action() tests
	// -------------------------------------------------------------------------

	/**
	 * Create a mock attachment post with a given MIME type.
	 *
	 * @param string $mime_type The MIME type for the attachment.
	 * @return \WP_Post
	 */
	private function create_attachment_post( $mime_type = 'image/jpeg' ) {
		$attachment_id = self::factory()->attachment->create(
			array(
				'post_mime_type' => $mime_type,
				'post_type'      => 'attachment',
			)
		);
		return get_post( $attachment_id );
	}

	/**
	 * Test row action is added for supported JPEG image.
	 */
	public function test_row_action_added_for_jpeg() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/jpeg' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
		$this->assertStringContainsString( 'Edit with AI', $actions['edit-with-ai'] );
		$this->assertStringContainsString( 'big-sky-image-studio-link', $actions['edit-with-ai'] );
		$this->assertStringContainsString( 'data-attachment-id="' . $post->ID . '"', $actions['edit-with-ai'] );
	}

	/**
	 * Test row action is added for supported PNG image.
	 */
	public function test_row_action_added_for_png() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/png' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is added for supported WebP image.
	 */
	public function test_row_action_added_for_webp() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/webp' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is added for supported JPG image.
	 */
	public function test_row_action_added_for_jpg() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/jpg' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is added for supported BMP image.
	 */
	public function test_row_action_added_for_bmp() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/bmp' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is added for supported TIFF image.
	 */
	public function test_row_action_added_for_tiff() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/tiff' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is NOT added for unsupported MIME type (PDF).
	 */
	public function test_row_action_not_added_for_pdf() {
		$post    = $this->create_attachment_post( 'application/pdf' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayNotHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is NOT added for unsupported MIME type (video).
	 */
	public function test_row_action_not_added_for_video() {
		$post    = $this->create_attachment_post( 'video/mp4' );
		$actions = ImageStudio\add_image_studio_row_action( array( 'edit' => '<a>Edit</a>' ), $post );

		$this->assertArrayNotHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is inserted before the 'edit' action.
	 */
	public function test_row_action_inserted_before_edit() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/jpeg' );
		$actions = ImageStudio\add_image_studio_row_action(
			array(
				'trash' => '<a>Trash</a>',
				'edit'  => '<a>Edit</a>',
				'view'  => '<a>View</a>',
			),
			$post
		);

		$keys = array_keys( $actions );
		$this->assertSame( array( 'trash', 'edit-with-ai', 'edit', 'view' ), $keys );
	}

	/**
	 * Test row action is appended when 'edit' action is not present.
	 */
	public function test_row_action_appended_when_no_edit_action() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/jpeg' );
		$actions = ImageStudio\add_image_studio_row_action(
			array(
				'trash' => '<a>Trash</a>',
				'view'  => '<a>View</a>',
			),
			$post
		);

		$keys = array_keys( $actions );
		$this->assertSame( array( 'trash', 'view', 'edit-with-ai' ), $keys );
	}

	/**
	 * Test row action preserves all existing actions.
	 */
	public function test_row_action_preserves_existing_actions() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = $this->create_attachment_post( 'image/jpeg' );
		$actions = ImageStudio\add_image_studio_row_action(
			array(
				'edit'  => '<a>Edit</a>',
				'trash' => '<a>Trash</a>',
			),
			$post
		);

		$this->assertArrayHasKey( 'edit', $actions );
		$this->assertArrayHasKey( 'trash', $actions );
		$this->assertArrayHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * Test row action is not added when user cannot edit the attachment.
	 */
	public function test_row_action_not_added_without_edit_permission() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$post             = $this->create_attachment_post( 'image/jpeg' );
		$original_actions = array(
			'trash' => '<a>Trash</a>',
		);

		$actions = ImageStudio\add_image_studio_row_action( $original_actions, $post );

		$this->assertSame( $original_actions, $actions );
		$this->assertArrayNotHasKey( 'edit-with-ai', $actions );
	}

	/**
	 * The "Edit with AI" row action is not registered for a user who has not
	 * connected their own WordPress.com account.
	 */
	public function test_row_action_not_registered_when_current_user_not_connected() {
		$callback = 'Automattic\\Jetpack\\Extensions\\ImageStudio\\add_image_studio_row_action';

		$non_connected_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $non_connected_admin );
		$this->set_media_library_screen();
		remove_filter( 'media_row_actions', $callback, 10 );

		ImageStudio\register_row_action();

		$this->assertFalse( has_filter( 'media_row_actions', $callback ) );
	}

	// -------------------------------------------------------------------------
	// is_big_sky_enabled() tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_big_sky_enabled returns false when Big_Sky class does not exist.
	 */
	public function test_is_big_sky_enabled_false_when_class_missing() {
		$this->assertFalse( ImageStudio\is_big_sky_enabled() );
	}

	/**
	 * Test is_big_sky_enabled returns true when Big_Sky class exists and option defaults to '1'.
	 */
	public function test_is_big_sky_enabled_true_with_class_and_default_option() {
		$this->simulate_big_sky_class();
		// Remove the option so get_option falls back to the default '1'.
		delete_option( 'big_sky_enable' );
		$this->assertTrue( ImageStudio\is_big_sky_enabled() );
	}

	/**
	 * Test is_big_sky_enabled returns true when Big_Sky class exists and option is '1'.
	 */
	public function test_is_big_sky_enabled_true_with_class_and_option_enabled() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '1' );
		$this->assertTrue( ImageStudio\is_big_sky_enabled() );
	}

	/**
	 * Test is_big_sky_enabled returns false when Big_Sky class exists but option is empty string.
	 */
	public function test_is_big_sky_enabled_false_with_class_and_option_empty() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '' );
		$this->assertFalse( ImageStudio\is_big_sky_enabled() );
	}

	/**
	 * Test is_big_sky_enabled returns false when Big_Sky class exists but option is '0'.
	 */
	public function test_is_big_sky_enabled_false_with_class_and_option_zero() {
		$this->simulate_big_sky_class();
		update_option( 'big_sky_enable', '0' );
		$this->assertFalse( ImageStudio\is_big_sky_enabled() );
	}

	// -------------------------------------------------------------------------
	// is_image_studio_enabled() + Big Sky integration tests
	// -------------------------------------------------------------------------

	/**
	 * AI extensions disabled when Image Studio enabled via Big Sky.
	 */
	public function test_ai_extensions_disabled_when_enabled_via_big_sky() {
		$this->enable_big_sky();
		ImageStudio\register_plugin();
		$this->make_ai_extensions_available();

		ImageStudio\disable_jetpack_ai_image_extensions();

		foreach ( self::get_ai_image_extensions() as $ext ) {
			$this->assertFalse(
				\Jetpack_Gutenberg::is_available( $ext ),
				"Extension $ext should be unavailable when Image Studio is enabled via Big Sky."
			);
		}
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

	// -------------------------------------------------------------------------
	// Feature clip post meta tests
	// -------------------------------------------------------------------------

	/**
	 * Test that the feature clip meta key constant is defined correctly.
	 */
	public function test_feature_clip_meta_key_constant() {
		$this->assertEquals( '_jetpack_feature_clip_id', ImageStudio\FEATURE_CLIP_META_KEY );
	}

	/**
	 * Test that the feature clip meta is registered for the 'post' object type
	 * with the expected schema (integer, single, exposed in REST).
	 */
	public function test_feature_clip_post_meta_registered_when_enabled() {
		// The plugin's `init` hook should have registered the meta during bootstrap.
		// Re-run the registration explicitly so the test isn't sensitive to setup order.
		ImageStudio\register_feature_clip_post_meta();

		$registered = get_registered_meta_keys( 'post', 'post' );
		$this->assertArrayHasKey( ImageStudio\FEATURE_CLIP_META_KEY, $registered );

		$schema = $registered[ ImageStudio\FEATURE_CLIP_META_KEY ];
		$this->assertSame( 'integer', $schema['type'] );
		$this->assertTrue( $schema['single'] );
		$this->assertTrue( $schema['show_in_rest'] );
		$this->assertSame( 0, $schema['default'] );
		$this->assertSame( 'absint', $schema['sanitize_callback'] );
		$this->assertIsCallable( $schema['auth_callback'] );
	}

	/**
	 * Test that the registered default surfaces as `0` from `get_post_meta()`
	 * for posts without an explicit value, so REST clients always see a
	 * deterministic integer instead of `null` or an empty string.
	 */
	public function test_feature_clip_meta_default_value_is_zero() {
		ImageStudio\register_feature_clip_post_meta();

		$post_id = self::factory()->post->create();
		$value   = get_post_meta( $post_id, ImageStudio\FEATURE_CLIP_META_KEY, true );

		$this->assertSame( 0, $value );
	}

	/**
	 * Test that the meta auth callback grants access when the user can edit the post.
	 */
	public function test_feature_clip_meta_auth_callback_grants_when_user_can_edit_post() {
		$user_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );

		wp_set_current_user( $user_id );

		$this->assertTrue(
			ImageStudio\feature_clip_meta_auth_callback( false, ImageStudio\FEATURE_CLIP_META_KEY, $post_id )
		);
	}

	/**
	 * Test that the meta auth callback denies access when the user cannot edit the post.
	 */
	public function test_feature_clip_meta_auth_callback_denies_when_user_cannot_edit_post() {
		$post_id       = self::factory()->post->create();
		$subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		wp_set_current_user( $subscriber_id );

		$this->assertFalse(
			ImageStudio\feature_clip_meta_auth_callback( true, ImageStudio\FEATURE_CLIP_META_KEY, $post_id )
		);
	}

	/**
	 * Test that the meta auth callback denies access for an anonymous user.
	 */
	public function test_feature_clip_meta_auth_callback_denies_anonymous_user() {
		$post_id = self::factory()->post->create();
		wp_set_current_user( 0 );

		$this->assertFalse(
			ImageStudio\feature_clip_meta_auth_callback( true, ImageStudio\FEATURE_CLIP_META_KEY, $post_id )
		);
	}

	/**
	 * Test that the registration is gated on `is_image_studio_enabled()`. When
	 * Image Studio is disabled, calling the registration helper directly is a no-op.
	 */
	public function test_feature_clip_post_meta_skipped_when_disabled() {
		// Force the gate to false by disabling AI features and Big Sky.
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		// Unregister any prior registration so we can detect a no-op.
		unregister_post_meta( 'post', ImageStudio\FEATURE_CLIP_META_KEY );

		ImageStudio\register_feature_clip_post_meta();

		$registered = get_registered_meta_keys( 'post', 'post' );
		$this->assertArrayNotHasKey( ImageStudio\FEATURE_CLIP_META_KEY, $registered );

		remove_filter( 'jetpack_ai_enabled', '__return_false' );

		// Restore for any later tests that depend on the meta being present.
		ImageStudio\register_feature_clip_post_meta();
	}

	// -------------------------------------------------------------------------
	// Hook priority tests
	// -------------------------------------------------------------------------

	/**
	 * Disable_jetpack_ai_image_extensions must run after AI extensions register.
	 */
	public function test_disable_ai_extensions_priority_after_ai_assistant() {
		$hook = 'jetpack_register_gutenberg_extensions';

		$jp_ai_priority   = has_action(
			$hook,
			'Automattic\Jetpack\Extensions\AiAssistantPlugin\register_plugin'
		);
		$disable_priority = has_action(
			$hook,
			'Automattic\Jetpack\Extensions\ImageStudio\disable_jetpack_ai_image_extensions'
		);

		$this->assertNotFalse( $jp_ai_priority, 'AI Assistant register_plugin should be hooked.' );
		$this->assertNotFalse( $disable_priority, 'disable_jetpack_ai_image_extensions should be hooked.' );
		$this->assertGreaterThan( $jp_ai_priority, $disable_priority );
	}
}
