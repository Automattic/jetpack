<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Spotify extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [spotify] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_spotify_exists() {
		$this->assertEquals( shortcode_exists( 'spotify' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_spotify() {
		$content = '[spotify]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Spotify player based on the ID.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_spotify_player_id() {
		$track_id = '55fQ9iIkC2qajnlvI1iMWO';
		$content  = "[spotify spotify:track:$track_id]";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'https://embed.spotify.com/?uri=' . rawurlencode( "spotify:track:$track_id" ), $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Spotify player based on the URL.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_spotify_player_url() {
		$track_id  = '55fQ9iIkC2qajnlvI1iMWO';
		$track_url = "https://play.spotify.com/track/$track_id";
		$content   = "[spotify $track_url]";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'https://embed.spotify.com/?uri=' . rawurlencode( "https://play.spotify.com/track/$track_id" ), $shortcode_content );
	}

	/**
	 * Verify that content like "spotify:track:55fQ9iIkC2qajnlvI1iMWO" on its own line, it will be converted to a player.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_spotify_player_content() {
		$track_id = '55fQ9iIkC2qajnlvI1iMWO';
		$content  = "spotify:track:$track_id";

		$content = apply_filters( 'the_content', $content );
		$this->assertStringContainsString( 'https://embed.spotify.com/?uri=' . rawurlencode( "spotify:track:$track_id" ), $content );
	}

	/**
	 * Verify that content like "spotify:track:55fQ9iIkC2qajnlvI1iMWO" that is not in its own line, won't be converted to a player.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_spotify_player_content_no_line() {
		$track_id = '55fQ9iIkC2qajnlvI1iMWO';
		$content  = "This is another text spotify:track:$track_id surrounding this Spotify track.";

		$content = apply_filters( 'the_content', $content );
		$this->assertStringContainsString( "spotify:track:$track_id", $content );
	}

	/**
	 * Verify that content like "spotify:track:55fQ9iIkC2qajnlvI1iMWO" on its own line, not preceded by an HTML tag, will be converted to a player.
	 *
	 * @since 8.6.0
	 */
	public function test_shortcodes_spotify_player_content_no_html() {
		$track_id = '55fQ9iIkC2qajnlvI1iMWO';
		$content  = "This is another plain text before a spotify track
		spotify:track:$track_id";

		$content = apply_filters( 'the_content', $content );
		$this->assertStringContainsString( 'https://embed.spotify.com/?uri=' . rawurlencode( "spotify:track:$track_id" ), $content );
	}

	/**
	 * Verify that shortcode content iframe contains loading='lazy' attribute
	 */
	public function test_shortcodes_spotify_lazy_loading() {
		$content           = '[spotify https://open.spotify.com/album/4BC7xFBCxUMBEgGpxRBaCy width=\"400\" height=\"100\"]';
		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<iframe', $shortcode_content );
		$this->assertStringContainsString( 'loading="lazy"', $shortcode_content );
	}
}
