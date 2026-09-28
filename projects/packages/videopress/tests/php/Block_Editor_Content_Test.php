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
	/** Uses the supplied height-to-width percentage when no height is set. */
	public function test_shortcode_uses_video_ratio() {
		$html = Block_Editor_Content::videopress_embed_shortcode(
			array(
				'abcDEF12',
				'w'          => 360,
				'videoratio' => 160,
			)
		);
		$this->assertStringContainsString( 'width="360"', $html );
		$this->assertStringContainsString( 'height="576"', $html );
	}

	/** Keeps an explicit height ahead of the inferred ratio. */
	public function test_shortcode_preserves_explicit_height() {
		$html = Block_Editor_Content::videopress_embed_shortcode(
			array(
				'abcDEF12',
				'w'          => 360,
				'h'          => 200,
				'videoratio' => 160,
			)
		);
		$this->assertStringContainsString( 'height="200"', $html );
	}

	/** Falls back to 16:9 when the ratio is invalid. */
	public function test_shortcode_rejects_invalid_ratios() {
		foreach ( array( null, 0, -10, 'invalid', INF, array( 100 ) ) as $ratio ) {
			$html = Block_Editor_Content::videopress_embed_shortcode(
				array(
					'abcDEF12',
					'w'          => 640,
					'videoratio' => $ratio,
				)
			);
			$this->assertStringContainsString( 'height="360"', $html );
		}
	}

	/** Passes videoRatio through the core video shortcode adapter. */
	public function test_video_shortcode_passes_video_ratio() {
		$html = Block_Editor_Content::video_shortcode_override(
			'',
			array(
				'videopress_guid' => 'abcDEF12',
				'width'           => 400,
				'videoRatio'      => 150,
			),
			'',
			0
		);
		$this->assertStringContainsString( 'height="600"', $html );
	}

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
		remove_filter( 'default_content', array( Block_Editor_Content::class, 'videopress_video_block_by_guid' ), 10 );
		unset( $_GET['videopress_guid'], $_GET['_wpnonce'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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

	/**
	 * Register the default-content handler without the standalone plugin.
	 */
	public function test_default_content_filter_registered_without_standalone_plugin() {
		$this->assertFalse(
			class_exists( 'Jetpack_VideoPress_Plugin', false ),
			'Pre-condition: standalone plugin class must not exist in this process.'
		);

		Block_Editor_Content::init();

		$this->assertNotFalse(
			has_filter( 'default_content', array( Block_Editor_Content::class, 'videopress_video_block_by_guid' ) ),
			'default_content filter must be registered even when the standalone plugin is not active.'
		);
	}

	/**
	 * Inserts a VideoPress block when a valid nonce and GUID are present.
	 */
	public function test_videopress_video_block_by_guid_injects_block_with_valid_nonce() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'vp_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'draft',
			)
		);

		$_GET['videopress_guid'] = 'abcd1234'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET['_wpnonce']        = wp_create_nonce( 'videopress-content-nonce' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$result = Block_Editor_Content::videopress_video_block_by_guid( '', get_post( $post_id ) );

		$this->assertStringContainsString( '<!-- wp:videopress/video {"guid":"abcd1234"} -->', $result );
		$this->assertStringContainsString( '<!-- /wp:videopress/video -->', $result );
	}

	/**
	 * Leaves content unchanged when the nonce is invalid.
	 */
	public function test_videopress_video_block_by_guid_no_injection_with_invalid_nonce() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'vp_editor2',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'draft',
			)
		);

		$_GET['videopress_guid'] = 'abcd1234'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET['_wpnonce']        = 'bad-nonce'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$result = Block_Editor_Content::videopress_video_block_by_guid( '', get_post( $post_id ) );

		$this->assertSame( '', $result );
	}
}
