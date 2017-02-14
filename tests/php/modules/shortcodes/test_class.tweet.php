<?php

class WP_Test_Jetpack_Shortcodes_Tweet extends WP_UnitTestCase {

	/**
	 * Verify that [tweet] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_tweet_exists() {
		$this->assertEquals( shortcode_exists( 'tweet' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet() {
		$content = '[tweet]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Invalid tweet id -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a tweet card.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_card() {
		$content = "[tweet https://twitter.com/jetpack/status/759034293385502721]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<blockquote class="twitter-tweet"', $shortcode_content );
		$this->assertContains( '<a href="https://twitter.com/jetpack/status/759034293385502721">', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode with custom parameters adds them to the tweet card.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_card_parameters() {
		$content = "[tweet https://twitter.com/jetpack/status/759034293385502721 align=right lang=es]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'align="right"', $shortcode_content );
		$this->assertContains( 'data-lang="es"', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode with only the tweet ID produces a correct output.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_id_only() {
		$content = "[tweet 759034293385502721]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<blockquote class="twitter-tweet"', $shortcode_content );
		$this->assertContains( '<a href="https://twitter.com/jetpack/status/759034293385502721">', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode contains Jetpack's partner ID
	 *
	 * @since 4.6.0
	 */
	public function test_shortcode_tweet_partner_id() {
		$content = "[tweet 759034293385502721]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'data-partner="jetpack"', $shortcode_content );
	}
}
