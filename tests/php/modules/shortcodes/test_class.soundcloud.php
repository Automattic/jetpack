<?php

class WP_Test_Jetpack_Shortcodes_Soundcloud extends WP_UnitTestCase {

	public function test_shortcodes_soundcloud_exists() {
		$this->assertEquals( shortcode_exists( 'soundcloud' ), true );
	}

	public function test_shortcodes_soundcloud() {
		$content = '[soundcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_soundcloud_html() {
		$content = '[soundcloud url="https://api.soundcloud.com/tracks/156661852" params="auto_play=false&amp;hide_related=false&amp;visual=true" width="100%" height="450" iframe="true" /]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '<iframe width="100%" height="450"', $shortcode_content );
		$this->assertContains( 'w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F156661852&visual=true&auto_play=false&hide_related=false', $shortcode_content );
	}
}
