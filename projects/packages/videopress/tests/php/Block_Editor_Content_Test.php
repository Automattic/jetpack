<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Block_Editor_Content methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Class Block_Editor_Content_Test
 */
class Block_Editor_Content_Test extends BaseTestCase {

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'videopress_player_preload_disabled' );
		parent::tear_down();
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
				'abcDEF12',
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
				'abcDEF12',
				'preloadcontent' => 'metadata',
			)
		);

		$this->assertStringContainsString( 'preloadContent=none', $html );
		$this->assertStringNotContainsString( 'preloadContent=metadata', $html );
	}
}
