<?php
/**
 * Tests that Block_Editor_Extensions tells the block editor when to preview videos with the inline player.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WorDBless\BaseTestCase;

/**
 * The block editor reads `window.videoPressEditorState.inlinePlayer`: the bundle URLs when the
 * site renders players from the shared script, null otherwise.
 */
class Block_Editor_Extensions_Inline_Player_Test extends BaseTestCase {

	/**
	 * Script handle the payload is localized onto.
	 *
	 * @var string
	 */
	const HANDLE = 'test-videopress-block-editor';

	/**
	 * The handle Block_Editor_Extensions was configured with before this test.
	 *
	 * @var string
	 */
	private $previous_handle = '';

	/**
	 * Register a stand-in script so wp_localize_script() has something to attach to.
	 */
	public function set_up() {
		parent::set_up();

		$this->previous_handle                  = Block_Editor_Extensions::$script_handle;
		Block_Editor_Extensions::$script_handle = self::HANDLE;

		wp_register_script( self::HANDLE, 'https://example.org/test.js', array(), '1.0', true );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_deregister_script( self::HANDLE );
		Block_Editor_Extensions::$script_handle = $this->previous_handle;
		delete_option( 'videopress_inline_player_enabled' );
		delete_option( 'videopress_player_preload_disabled' );
		remove_all_filters( 'jetpack_videopress_player_use_iframe' );
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Run the localization and decode what `videoPressEditorState` ends up as.
	 *
	 * @return array
	 */
	private function get_localized_state() {
		Block_Editor_Extensions::enqueue_extensions();

		$data = wp_scripts()->get_data( self::HANDLE, 'data' );

		preg_match( '/var videoPressEditorState = (.*);/', (string) $data, $matches );

		return json_decode( $matches[1], true );
	}

	/**
	 * Tests that the editor gets no bundle config while the site embeds with iframes.
	 */
	public function test_inline_player_is_null_by_default() {
		$state = $this->get_localized_state();

		$this->assertArrayHasKey( 'inlinePlayer', $state );
		$this->assertNull( $state['inlinePlayer'] );
	}

	/**
	 * Tests that the editor gets the versioned bundle URLs once the setting is on.
	 */
	public function test_inline_player_carries_the_bundle_urls_when_enabled() {
		update_option( 'videopress_inline_player_enabled', 1 );

		$state = $this->get_localized_state();

		$this->assertSame(
			array(
				'script'          => 'https://v0.wordpress.com/js/videojs/videopress.js?ver=' . Package_Version::PACKAGE_VERSION,
				'style'           => 'https://v0.wordpress.com/js/videojs/videopress.css?ver=' . Package_Version::PACKAGE_VERSION,
				'preloadDisabled' => false,
			),
			$state['inlinePlayer']
		);
	}

	/**
	 * Tests that the site-wide preload opt-out reaches the editor with the bundle config.
	 */
	public function test_inline_player_reports_the_preload_opt_out() {
		update_option( 'videopress_inline_player_enabled', 1 );
		update_option( 'videopress_player_preload_disabled', 1 );

		$state = $this->get_localized_state();

		$this->assertTrue( $state['inlinePlayer']['preloadDisabled'] );
	}

	/**
	 * Tests that the iframe filter has the last word for the editor too.
	 */
	public function test_iframe_filter_turns_the_editor_config_off() {
		update_option( 'videopress_inline_player_enabled', 1 );
		add_filter( 'jetpack_videopress_player_use_iframe', '__return_true' );

		$this->assertNull( $this->get_localized_state()['inlinePlayer'] );
	}
}
