<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Block_Editor_Content methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Class Block_Editor_Content_Test
 *
 * Runs in separate processes because the shortcode loads Jwt_Token_Bridge, which
 * Uploader_Test replaces with a Mockery alias mock that requires the real class
 * to not be loaded yet.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Block_Editor_Content_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Each isolated process starts without the package's utility functions.
		require_once __DIR__ . '/../../src/utility-functions.php';
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'videopress_player_preload_disabled' );
		delete_option( 'videopress_inline_player_enabled' );
		parent::tear_down();
	}

	/**
	 * Test that the shortcode renders an inline player, with its own attributes, when the site turns it on.
	 */
	public function test_shortcode_renders_inline_player_when_enabled() {
		update_option( 'videopress_inline_player_enabled', true );

		$html = Block_Editor_Content::videopress_embed_shortcode(
			array(
				0         => 'abcDEF12',
				'w'       => 400,
				'h'       => 300,
				'muted'   => 'true',
				'preload' => 'none',
			)
		);

		$this->assertStringNotContainsString( '<iframe', $html );
		$this->assertStringContainsString( 'jetpack-videopress-player__wrapper', $html );
		$this->assertStringContainsString( 'data-videopress-guid="abcDEF12"', $html );
		$this->assertStringContainsString( '&quot;muted&quot;:true', $html );
		$this->assertStringContainsString( '&quot;preloadContent&quot;:&quot;none&quot;', $html );
		$this->assertStringContainsString( 'aspect-ratio:100 / 75', $html );
		$this->assertFalse( wp_script_is( 'videopress-iframe', 'enqueued' ) );
	}

	/**
	 * Test that the shortcode preloads metadata by default and honors an explicit preload attribute.
	 */
	public function test_shortcode_preload_attribute() {
		$html = Block_Editor_Content::videopress_embed_shortcode( array( 'abcDEF12' ) );
		$this->assertStringContainsString( 'videopress.com/embed/abcDEF12', $html );
		$this->assertStringContainsString( 'preloadContent=metadata', $html );

		$html = Block_Editor_Content::videopress_embed_shortcode(
			array(
				0         => 'abcDEF12',
				'preload' => 'none',
			)
		);
		$this->assertStringContainsString( 'preloadContent=none', $html );
	}

	/**
	 * Test that the site-wide preload opt-out overrides the shortcode's preload attribute.
	 */
	public function test_shortcode_honors_site_preload_opt_out() {
		update_option( 'videopress_player_preload_disabled', true );

		$html = Block_Editor_Content::videopress_embed_shortcode(
			array(
				0                => 'abcDEF12',
				'preloadcontent' => 'metadata',
			)
		);

		$this->assertStringContainsString( 'preloadContent=none', $html );
		$this->assertStringNotContainsString( 'preloadContent=metadata', $html );
	}
}
