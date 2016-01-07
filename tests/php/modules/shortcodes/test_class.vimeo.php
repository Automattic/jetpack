<?php

class WP_Test_Jetpack_Shortcodes_Vimeo extends WP_UnitTestCase {

	public function test_shortcodes_vimeo_exists() {
		$this->assertEquals( shortcode_exists( 'vimeo' ), true );
	}

	public function test_shortcodes_vimeo() {
		$content = '[vimeo]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_vimeo_id() {
		$video_id = '141358';
		$content  = '[vimeo ' . $video_id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
	}

	public function test_shortcodes_vimeo_url() {
		$video_id = '141358';
		$url      = 'http://vimeo.com/' . $video_id;
		$content  = '[vimeo ' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
	}

	public function test_shortcodes_vimeo_w_h() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' w=' . $width . '&h=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

	public function test_shortcodes_vimeo_width_height() {
		$video_id = '141358';
		$width    = '350';
		$height   = '500';
		$content  = '[vimeo ' . $video_id . ' width=' . $width . ' height=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

	public function test_shortcodes_vimeo_autoplay_loop() {
		$video_id = '141358';
		$autoplay = '1';
		$loop     = '1';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'loop=' . $loop, $shortcode_content );
		$this->assertContains( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_autoplay_loop_off() {
		$video_id = '141358';
		$autoplay = '0';
		$loop     = '0';
		$content  = '[vimeo ' . $video_id . ' autoplay=' . $autoplay . ' loop=' . $loop . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertNotContains( 'loop=' . $loop, $shortcode_content );
		$this->assertNotContains( 'autoplay=' . $autoplay, $shortcode_content );
	}

	public function test_shortcodes_vimeo_old_args() {
		$video_id = '141358';
		$args     = 'h=500&w=350';
		$content  = '[vimeo ' . $video_id . ' ' . $args . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'vimeo.com/video/' . $video_id, $shortcode_content );
		$this->assertContains( 'width="350"', $shortcode_content );
		$this->assertContains( 'height="500"', $shortcode_content );
	}

	public function test_vimeo_embed_to_shortcode_1() {
		$embed     = '<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_2() {
		$embed     = '<iframe src="https://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 18427511 w=400 h=225]<p><a href="http://vimeo.com/18427511">Eskmo \'We Got More\' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_3() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe><p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697 w=500 h=281]<p><a href="http://vimeo.com/81408697">Partly Cloudy Redux</a> from <a href="http://vimeo.com/level1">Level 1</a> on <a href="https://vimeo.com">Vimeo</a>.</p>';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_4() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697?byline=0&amp;badge=0&amp;color=ffffff" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697 w=500 h=281]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	function test_vimeo_embed_to_shortcode_5() {
		$embed     = '<iframe src="//player.vimeo.com/video/81408697"></iframe>';
		$shortcode = vimeo_embed_to_shortcode( $embed );

		$expected_shortcode = '[vimeo 81408697]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}
}