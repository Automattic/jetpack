<?php

class WP_Test_Jetpack_Shortcodes_TwitterTimeline extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::twitter_timeline_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_twitter_timeline_exists() {
		$this->assertEquals( shortcode_exists( 'twitter-timeline' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::twitter_timeline_shortcode
	 * @since 3.2
	 */
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
}
