<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Inline_Player.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Class Inline_Player_Test
 *
 * Runs in separate processes because rendering loads Jwt_Token_Bridge, which
 * Uploader_Test replaces with a Mockery alias mock that requires the real
 * class to not be loaded yet.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Inline_Player_Test extends BaseTestCase {

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'videopress_inline_player_enabled' );
		delete_option( 'videopress_player_preload_disabled' );
		remove_all_filters( 'jetpack_videopress_player_use_iframe' );
		remove_all_filters( 'jetpack_videopress_inline_player_options' );
		wp_dequeue_script( Inline_Player::PLAYER_HANDLE );
		wp_dequeue_script( Inline_Player::BOOT_HANDLE );
		wp_dequeue_style( Inline_Player::PLAYER_HANDLE );
		parent::tear_down();
	}

	/**
	 * Iframes stay the default; the option and the filter both switch to the inline player.
	 */
	public function test_is_enabled_follows_the_option_and_the_filter() {
		$this->assertFalse( Inline_Player::is_enabled() );

		update_option( 'videopress_inline_player_enabled', true );
		$this->assertTrue( Inline_Player::is_enabled() );

		// The filter still has the last word, in both directions.
		add_filter( 'jetpack_videopress_player_use_iframe', '__return_true' );
		$this->assertFalse( Inline_Player::is_enabled() );

		remove_all_filters( 'jetpack_videopress_player_use_iframe' );
		delete_option( 'videopress_inline_player_enabled' );
		add_filter( 'jetpack_videopress_player_use_iframe', '__return_false' );
		$this->assertTrue( Inline_Player::is_enabled() );
	}

	/**
	 * Player options default like the iframe URL builder and map the block's attribute names.
	 */
	public function test_get_player_options_defaults_and_mapping() {
		$defaults = Inline_Player::get_player_options();

		$this->assertFalse( $defaults['autoPlay'] );
		$this->assertTrue( $defaults['controls'] );
		$this->assertTrue( $defaults['persistVolume'] );
		$this->assertTrue( $defaults['useAverageColor'] );
		$this->assertSame( 'metadata', $defaults['preloadContent'] );
		$this->assertSame( 'v2', $defaults['chrome'] );
		$this->assertArrayNotHasKey( 'poster', $defaults );
		$this->assertArrayNotHasKey( 'at', $defaults );

		$options = Inline_Player::get_player_options(
			array(
				'autoplay'            => true,
				'controls'            => false,
				'muted'               => true,
				'preload'             => 'none',
				'poster'              => 'https://example.com/poster.jpg',
				'seekbarColor'        => 'red',
				'seekbarPlayedColor'  => 'green',
				'seekbarLoadingColor' => 'blue',
				'at'                  => '12',
			)
		);

		$this->assertTrue( $options['autoPlay'] );
		$this->assertFalse( $options['controls'] );
		$this->assertTrue( $options['muted'] );
		$this->assertFalse( $options['persistVolume'] );
		$this->assertSame( 'none', $options['preloadContent'] );
		$this->assertSame( 'https://example.com/poster.jpg', $options['poster'] );
		$this->assertSame( 'red', $options['seekbarColor'] );
		$this->assertSame( 'green', $options['seekbarPlayedColor'] );
		$this->assertSame( 'blue', $options['seekbarLoadedColor'] );
		$this->assertSame( 12, $options['at'] );
	}

	/**
	 * The site-wide preload opt-out overrides the embed's own preload value, and the options filter applies.
	 */
	public function test_get_player_options_honors_site_preload_opt_out_and_filter() {
		update_option( 'videopress_player_preload_disabled', true );
		$this->assertSame( 'none', Inline_Player::get_player_options( array( 'preload' => 'auto' ) )['preloadContent'] );

		add_filter(
			'jetpack_videopress_inline_player_options',
			function ( $options ) {
				$options['chrome'] = 'v1';
				return $options;
			}
		);
		$this->assertSame( 'v1', Inline_Player::get_player_options()['chrome'] );
	}

	/**
	 * Embed URL query strings are read back into attributes, including entity-encoded ampersands.
	 */
	public function test_get_attributes_from_embed_url() {
		$this->assertSame( array(), Inline_Player::get_attributes_from_embed_url( 'https://videopress.com/v/abcDEF12' ) );

		$attributes = Inline_Player::get_attributes_from_embed_url(
			'https://videopress.com/embed/abcDEF12?autoPlay=1&amp;controls=0&amp;preloadContent=none&amp;posterUrl=https%3A%2F%2Fexample.com%2Fp.jpg&amp;sbc=red&amp;at=7&amp;cover=1'
		);

		$this->assertTrue( $attributes['autoplay'] );
		$this->assertFalse( $attributes['controls'] );
		$this->assertSame( 'none', $attributes['preload'] );
		$this->assertSame( 'https://example.com/p.jpg', $attributes['poster'] );
		$this->assertSame( 'red', $attributes['seekbarColor'] );
		$this->assertSame( 7, $attributes['at'] );
		$this->assertTrue( $attributes['cover'] );
	}

	/**
	 * Rendering emits a placeholder carrying the GUID, the options and the aspect ratio, and enqueues the shared assets once.
	 */
	public function test_render_outputs_a_placeholder_and_enqueues_assets_once() {
		$html = Inline_Player::render(
			'abcDEF12',
			array(
				'muted'  => true,
				'chrome' => 'v2',
			),
			56.25
		);

		$this->assertStringContainsString( 'class="jetpack-videopress-player__inline"', $html );
		$this->assertStringContainsString( 'data-videopress-guid="abcDEF12"', $html );
		$this->assertStringContainsString( 'aspect-ratio:100 / 56.25', $html );
		$this->assertStringContainsString( '&quot;muted&quot;:true', $html );
		$this->assertStringNotContainsString( '<iframe', $html );
		$this->assertStringNotContainsString( '<script', $html );

		// A second render shares the same assets.
		Inline_Player::render( 'ghiJKL34' );

		$this->assertTrue( wp_script_is( Inline_Player::PLAYER_HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_script_is( Inline_Player::BOOT_HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_style_is( Inline_Player::PLAYER_HANDLE, 'enqueued' ) );
		$this->assertSame( Inline_Player::PLAYER_SCRIPT_URL, wp_scripts()->registered[ Inline_Player::PLAYER_HANDLE ]->src );
		$this->assertContains( Inline_Player::PLAYER_HANDLE, wp_scripts()->registered[ Inline_Player::BOOT_HANDLE ]->deps );
		$this->assertStringContainsString( 'build/lib/inline-player.js', wp_scripts()->registered[ Inline_Player::BOOT_HANDLE ]->src );
		$this->assertTrue( wp_script_is( Jwt_Token_Bridge::SCRIPT_HANDLE, 'enqueued' ) );
	}

	/**
	 * Unknown aspect ratios fall back to 16:9, and invalid GUIDs render nothing.
	 */
	public function test_render_edge_cases() {
		$this->assertStringContainsString( 'aspect-ratio:100 / 56.25', Inline_Player::render( 'abcDEF12' ) );
		$this->assertStringContainsString( 'aspect-ratio:100 / 100', Inline_Player::render( 'abcDEF12', array(), 100 ) );
		$this->assertSame( '', Inline_Player::render( 'not a guid' ) );
		$this->assertSame( '', Inline_Player::render( '' ) );
	}
}
