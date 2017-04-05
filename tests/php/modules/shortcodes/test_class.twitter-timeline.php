<?php

/**
 * Shortcode for Twitter Timeline
 *
 * Example: [twitter-timeline id="297487559557251073" username="wordpressdotcom"]
 *
 * Expected shortcode output:
 * <a class="twitter-timeline" width="450" height="282" href="https://twitter.com/wordpressdotcom/" data-widget-id="297487559557251073">Tweets by @wordpressdotcom</a>
 *
 * @param
 *
 * @return
 */
class WP_Test_Jetpack_Shortcodes_TwitterTimeline extends WP_UnitTestCase {

	public function test_shortcodes_twitter_timeline_exists() {
		$this->assertEquals( shortcode_exists( 'twitter-timeline' ), true );
	}

	public function test_shortcodes_twitter_timeline() {
		$content = '[twitter-timeline]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode contains Jetpack's partner ID
	 *
	 * @since 4.6.0
	 */
	public function test_shortcode_tweet_partner_id() {
		$content = "[twitter-timeline username=automattic]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'data-partner="jetpack"', $shortcode_content );
	}

	public function test_shortcodes_twitter_timeline_missing_username() {
		$content = '[twitter-timeline id="297487559557251073"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $shortcode_content, '<!-- Invalid Twitter Timeline username -->' );
	}

	public function test_shortcodes_twitter_timeline_missing_id() {
		$content = '[twitter-timeline username="wordpressdotcom"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $shortcode_content, '<!-- Invalid Twitter Timeline id -->' );
	}


	public function test_shortcodes_twitter_timeline_html() {
		$content = '[twitter-timeline id="297487559557251073" username="wordpressdotcom"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $shortcode_content, '<a class="twitter-timeline" width="450" height="282" href="https://twitter.com/wordpressdotcom/" data-widget-id="297487559557251073">Tweets by @wordpressdotcom</a>' );
	}

	public function test_shortcodes_twitter_timeline_username() {
		$content = '[twitter-timeline id="297487559557251073" username="wordpressdotcom"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $shortcode_content, '<a class="twitter-timeline" width="450" height="282" href="https://twitter.com/wordpressdotcom/" data-widget-id="297487559557251073">Tweets by @wordpressdotcom</a>' );
	}

	public function test_shortcodes_twitter_timeline_height_width() {
		$content = '[twitter-timeline id="297487559557251073" username="wordpressdotcom" height="100" width="100"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $shortcode_content, '<a class="twitter-timeline" width="100" height="100" href="https://twitter.com/wordpressdotcom/" data-widget-id="297487559557251073">Tweets by @wordpressdotcom</a>' );
	}
}
