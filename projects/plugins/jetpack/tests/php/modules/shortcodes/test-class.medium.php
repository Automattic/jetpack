<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Medium extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [medium] exists.
	 *
	 * @since  7.4.0
	 */
	public function test_shortcodes_medium_exists() {
		$this->assertEquals( shortcode_exists( 'medium' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_medium_empty() {
		$content = '[medium]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Missing Medium URL -->', $shortcode_content );
	}

	/**
	 * Verify that a post with a link to a Profile page displays profile markup.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcode_medium_faux_embed_profile() {
		$profile_url = 'https://medium.com/@jeherve';

		$content = apply_filters( 'the_content', $profile_url );

		$this->assertStringContainsString(
			'<a class="m-profile" href="' . $profile_url,
			$content
		);
	}

	/**
	 * Verify that a post with a link to a Medium story displays story markup.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcode_medium_faux_embed_story() {
		$story_url = 'https://medium.com/@jeherve/this-is-a-story-19f582daaf5b';

		$content = apply_filters( 'the_content', $story_url );

		$this->assertStringContainsString(
			'<a class="m-story" href="' . $story_url,
			$content
		);
	}

	/**
	 * Verify that a post with a link to a Medium collection displays link (collection embeds are not supported anymore).
	 *
	 * @since 7.4.0
	 */
	public function test_shortcode_medium_faux_embed_collection() {
		$collection_url = 'https://medium.com/s/user-friendly';

		$content = apply_filters( 'the_content', $collection_url );

		$this->assertStringContainsString(
			'<a href="' . $collection_url . '" target="_blank" rel="noopener noreferrer">View this collection on Medium.com</a>',
			$content
		);
	}
}
