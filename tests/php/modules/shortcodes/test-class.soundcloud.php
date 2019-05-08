<?php

class WP_Test_Jetpack_Shortcodes_Soundcloud extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::soundcloud_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_soundcloud_exists() {
		$this->assertEquals( shortcode_exists( 'soundcloud' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::soundcloud_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_soundcloud() {
		$content = '[soundcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_soundcloud_html() {
		$content = '[soundcloud url="https://api.soundcloud.com/tracks/156661852" params="auto_play=false&amp;hide_related=false&amp;visual=true" width="100%" height="450" iframe="true" /]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F156661852&auto_play=false&hide_related=false&visual=true', $shortcode_content );
	}

	public function test_shortcodes_implicit_non_visual() {
		$content = '[soundcloud url="https://api.soundcloud.com/tracks/156661852" params="auto_play=false&amp;hide_related=false" width="100%" height="450" iframe="true" /]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F156661852&auto_play=false&hide_related=false', $shortcode_content );
	}

	public function test_shortcodes_explicit_non_visual() {
		$content = '[soundcloud url="https://api.soundcloud.com/tracks/156661852" params="auto_play=false&amp;hide_related=false&amp;visual=false" width="100%" height="450" iframe="true" /]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F156661852&auto_play=false&hide_related=false', $shortcode_content );
	}

	/**
	 * Test single tracks with no height specified.
	 *
	 * @since 7.4.0
	 */
	public function tests_shortcodes_soundcloud_single_track_no_height() {
		$content = '[soundcloud url="https://soundcloud.com/closetorgan/paul-is-dead"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="166"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fclosetorgan%2Fpaul-is-dead&width=false&height=false&auto_play=false&hide_related=false&visual=false&show_comments=false&color=false&show_user=false&show_reposts=false', $shortcode_content );
	}

	/**
	 * Tests albums with no height specified.
	 *
	 * @since 7.4.0
	 */
	public function tests_shortcodes_soundcloud_album_no_height() {
		$content = '[soundcloud url="https://soundcloud.com/closetorgan/sets/smells-like-lynx-africa-private"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fclosetorgan%2Fsets%2Fsmells-like-lynx-africa-private&width=false&height=false&auto_play=false&hide_related=false&visual=false&show_comments=false&color=false&show_user=false&show_reposts=false', $shortcode_content );
	}

	/**
	 * Tests albums with a custom color.
	 *
	 * @since 7.4.0
	 */
	public function tests_shortcodes_soundcloud_album_custom_color() {
		$content = '[soundcloud url="https://soundcloud.com/closetorgan/sets/smells-like-lynx-africa-private" color="00cc11"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fclosetorgan%2Fsets%2Fsmells-like-lynx-africa-private&width=false&height=false&auto_play=false&hide_related=false&visual=false&show_comments=false&show_user=false&show_reposts=false&color=00cc11', $shortcode_content );
	}

	/**
	 * Shortcode reversals.
	 */
	public function test_shortcodes_soundcloud_reversal_player() {
		$content = '<iframe width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/4142297&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>';

		$shortcode_content = jetpack_soundcloud_embed_reversal( $content );
		$shortcode_content = str_replace( "\n", '', $shortcode_content );

		$this->assertEquals( $shortcode_content, '[soundcloud url="https://api.soundcloud.com/playlists/4142297" params="auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true" width="100%" height="450" iframe="true" /]' );
	}

	public function test_shortcodes_soundcloud_reversal_embed() {
		$content = '<object height="81" width="100%">
				<param name="movie" value="https://player.soundcloud.com/player.swf?url=http://api.soundcloud.com/tracks/70198773" />
				<param name="allowscriptaccess" value="always" />
				<embed allowscriptaccess="always" height="81" src="https://player.soundcloud.com/player.swf?url=http://api.soundcloud.com/tracks/70198773" type="application/x-shockwave-flash" width="100%"></embed>
			</object>';

		$shortcode_content = wp_kses_post( $content );

		$this->assertEquals( $shortcode_content, '<a href="https://player.soundcloud.com/player.swf?url=http://api.soundcloud.com/tracks/70198773">https://player.soundcloud.com/player.swf?url=http://api.soundcloud.com/tracks/70198773</a>' );
	}
}
