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

	const GUID = 'abcDEF12';

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Each isolated process starts without the package's utility functions.
		require_once __DIR__ . '/../../src/utility-functions.php';
		Inline_Player::reset();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'videopress_inline_player_enabled' );
		delete_option( 'videopress_player_preload_disabled' );
		delete_option( 'videopress_private_enabled_for_site' );
		delete_transient( 'jetpack_videopress_' . self::GUID );
		delete_transient( 'videopress_get_post_id_by_guid_' . self::GUID );
		wp_cache_flush();
		remove_all_filters( 'jetpack_videopress_player_use_iframe' );
		remove_all_filters( 'jetpack_videopress_inline_player_options' );
		remove_all_filters( 'jetpack_videopress_inline_player_facade' );
		remove_all_filters( 'jetpack_videopress_inline_player_poster' );
		wp_dequeue_script( Inline_Player::PLAYER_HANDLE );
		wp_dequeue_script( Inline_Player::BOOT_HANDLE );
		wp_dequeue_style( Inline_Player::PLAYER_HANDLE );
		wp_dequeue_style( Inline_Player::BOOT_HANDLE );
		Inline_Player::reset();
		parent::tear_down();
	}

	/**
	 * Create a VideoPress attachment whose metadata carries a poster for the given GUID.
	 *
	 * @param string $guid   GUID recorded in the metadata.
	 * @param string $poster Poster URL recorded in the metadata.
	 * @return int Attachment ID.
	 */
	private function create_attachment( $guid, $poster ) {
		$id = wp_insert_attachment(
			array(
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Clip',
				'post_status'    => 'inherit',
			)
		);
		update_post_meta( $id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$id,
			array(
				'videopress' => array(
					'guid'   => $guid,
					'poster' => $poster,
				),
			)
		);

		return $id;
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
	 * By default a placeholder is a poster facade: no player bundle on the page, a play button, and the poster eager for the first video only.
	 */
	public function test_render_facade_by_default() {
		$html = Inline_Player::render(
			'abcDEF12',
			array( 'muted' => true ),
			56.25,
			array(
				'poster' => 'https://example.com/poster.jpg',
				'title'  => 'My <clip>',
			)
		);

		$this->assertStringContainsString( 'class="jetpack-videopress-player__inline is-facade"', $html );
		$this->assertStringContainsString( 'data-videopress-facade="1"', $html );
		$this->assertStringContainsString( '<button type="button" class="jetpack-videopress-player__facade" aria-label="Play video: My &lt;clip&gt;">', $html );
		$this->assertStringContainsString( '<img class="jetpack-videopress-player__facade-poster" src="https://example.com/poster.jpg" alt="" decoding="async" fetchpriority="high">', $html );
		$this->assertStringContainsString( 'jetpack-videopress-player__facade-play', $html );
		$this->assertStringContainsString( '&quot;muted&quot;:true', $html );

		// The player bundle is left for the boot script to fetch on click; its URLs travel in the config.
		$this->assertFalse( wp_script_is( Inline_Player::PLAYER_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_style_is( Inline_Player::PLAYER_HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_script_is( Inline_Player::BOOT_HANDLE, 'enqueued' ) );
		$before = implode( "\n", (array) wp_scripts()->get_data( Inline_Player::BOOT_HANDLE, 'before' ) );
		$this->assertStringContainsString( 'window.jetpackVideoPressInlinePlayer = {', $before );
		$this->assertStringContainsString( Inline_Player::PLAYER_SCRIPT_URL, $before );
		$this->assertStringContainsString( Inline_Player::PLAYER_STYLE_URL, $before );

		// The facade's own styles ride inline on a registered style handle.
		$this->assertTrue( wp_style_is( Inline_Player::BOOT_HANDLE, 'enqueued' ) );
		$inline_css = implode( "\n", (array) wp_styles()->get_data( Inline_Player::BOOT_HANDLE, 'after' ) );
		$this->assertStringContainsString( '.jetpack-videopress-player__facade-poster{', $inline_css );

		// A second facade lazy-loads its poster and does not repeat the styles.
		$second = Inline_Player::render( 'ghiJKL34', array(), null, array( 'poster' => 'https://example.com/two.jpg' ) );
		$this->assertStringContainsString( 'src="https://example.com/two.jpg" alt="" decoding="async" loading="lazy">', $second );
		$this->assertSame( 1, substr_count( implode( "\n", (array) wp_styles()->get_data( Inline_Player::BOOT_HANDLE, 'after' ) ), '.jetpack-videopress-player__facade-poster{' ) );

		// No poster: still a facade, just without the image.
		$bare = Inline_Player::render( 'mnoPQR56' );
		$this->assertStringContainsString( 'data-videopress-facade="1"', $bare );
		$this->assertStringNotContainsString( '<img', $bare );
		$this->assertStringContainsString( 'aria-label="Play video"', $bare );
	}

	/**
	 * Autoplaying videos, an explicit `facade => false`, and the filter all mount the player at once.
	 */
	public function test_render_skips_the_facade_when_the_player_is_needed_at_once() {
		$html = Inline_Player::render( 'abcDEF12', array( 'autoPlay' => true ) );
		$this->assertStringNotContainsString( 'data-videopress-facade', $html );
		$this->assertStringNotContainsString( '<button', $html );
		$this->assertTrue( wp_script_is( Inline_Player::PLAYER_HANDLE, 'enqueued' ) );

		Inline_Player::reset();
		$this->assertStringNotContainsString( 'data-videopress-facade', Inline_Player::render( 'abcDEF12', array(), null, array( 'facade' => false ) ) );

		add_filter( 'jetpack_videopress_inline_player_facade', '__return_false' );
		$this->assertStringNotContainsString( 'data-videopress-facade', Inline_Player::render( 'abcDEF12' ) );
		$this->assertFalse( Inline_Player::should_use_facade() );
	}

	/**
	 * Poster resolution: block attribute, then the attachment's metadata ( by id or GUID ), then the cached video details.
	 */
	public function test_get_poster_url_precedence() {
		$this->assertSame( 'https://example.com/custom.jpg', Inline_Player::get_poster_url( self::GUID, array( 'poster' => 'https://example.com/custom.jpg' ) ) );

		$id = $this->create_attachment( self::GUID, 'https://videos.files.wordpress.com/abcDEF12/meta.jpg' );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/meta.jpg', Inline_Player::get_poster_url( self::GUID, array( 'id' => $id ) ) );
		// Without an id the attachment is found by GUID; WorDBless cannot run the lookup's
		// WP_Query, so prime the transient the lookup consults first.
		set_transient( 'videopress_get_post_id_by_guid_' . self::GUID, $id );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/meta.jpg', Inline_Player::get_poster_url( self::GUID ) );

		// An attachment that points at another video is not trusted; the cached lookup answers instead.
		$other = $this->create_attachment( 'zzzYYY99', 'https://videos.files.wordpress.com/zzzYYY99/other.jpg' );
		set_transient(
			'jetpack_videopress_' . self::GUID,
			(object) array(
				'poster'     => 'https://videos.files.wordpress.com/abcDEF12/api.jpg',
				'is_private' => false,
			)
		);
		wp_delete_attachment( $id, true );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/api.jpg', Inline_Player::get_poster_url( self::GUID, array( 'id' => $other ) ) );

		// The filter has the last word.
		add_filter( 'jetpack_videopress_inline_player_poster', '__return_null' );
		$this->assertNull( Inline_Player::get_poster_url( self::GUID, array( 'poster' => 'https://example.com/custom.jpg' ) ) );
	}

	/**
	 * A private video's frame never leaks into the facade, unless the block carries its own poster.
	 */
	public function test_get_poster_url_hides_private_videos() {
		$id = $this->create_attachment( self::GUID, 'https://videos.files.wordpress.com/abcDEF12/meta.jpg' );

		$this->assertNull(
			Inline_Player::get_poster_url(
				self::GUID,
				array(
					'id'        => $id,
					'isPrivate' => true,
				)
			)
		);
		$this->assertNull(
			Inline_Player::get_poster_url(
				self::GUID,
				array(
					'id'             => $id,
					'privacySetting' => 1,
				)
			)
		);

		update_option( 'videopress_private_enabled_for_site', true );
		$this->assertNull(
			Inline_Player::get_poster_url(
				self::GUID,
				array(
					'id'             => $id,
					'privacySetting' => 2,
				)
			),
			'Site default follows the site setting.'
		);
		$this->assertSame(
			'https://videos.files.wordpress.com/abcDEF12/meta.jpg',
			Inline_Player::get_poster_url(
				self::GUID,
				array(
					'id'             => $id,
					'privacySetting' => 0,
				)
			),
			'Explicitly public videos still get their poster.'
		);
		delete_option( 'videopress_private_enabled_for_site' );

		// The API says private: no poster either, even without block attributes.
		wp_delete_attachment( $id, true );
		set_transient(
			'jetpack_videopress_' . self::GUID,
			(object) array(
				'poster'     => 'https://videos.files.wordpress.com/abcDEF12/api.jpg',
				'is_private' => true,
			)
		);
		$this->assertNull( Inline_Player::get_poster_url( self::GUID ) );

		// A custom poster is the site owner's choice and is shown regardless.
		$this->assertSame(
			'https://example.com/custom.jpg',
			Inline_Player::get_poster_url(
				self::GUID,
				array(
					'poster'    => 'https://example.com/custom.jpg',
					'isPrivate' => true,
				)
			)
		);
	}

	/**
	 * Rendering emits a placeholder carrying the GUID, the options and the aspect ratio, and enqueues the shared assets once.
	 */
	public function test_render_outputs_a_placeholder_and_enqueues_assets_once() {
		add_filter( 'jetpack_videopress_inline_player_facade', '__return_false' );
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
		$this->assertSame( 1, substr_count( implode( "\n", (array) wp_scripts()->get_data( Inline_Player::BOOT_HANDLE, 'before' ) ), 'window.jetpackVideoPressInlinePlayer' ), 'The bundle config is printed once.' );
		$this->assertStringContainsString( 'build/lib/inline-player.js', wp_scripts()->registered[ Inline_Player::BOOT_HANDLE ]->src );
		$this->assertTrue( wp_script_is( Jwt_Token_Bridge::SCRIPT_HANDLE, 'enqueued' ) );
	}

	/**
	 * Unknown aspect ratios fall back to 16:9, and invalid GUIDs render nothing.
	 */
	public function test_render_edge_cases() {
		add_filter( 'jetpack_videopress_inline_player_facade', '__return_false' );
		$this->assertStringContainsString( 'aspect-ratio:100 / 56.25', Inline_Player::render( 'abcDEF12' ) );
		$this->assertStringContainsString( 'aspect-ratio:100 / 100', Inline_Player::render( 'abcDEF12', array(), 100 ) );
		$this->assertSame( '', Inline_Player::render( 'not a guid' ) );
		$this->assertSame( '', Inline_Player::render( '' ) );
	}
}
