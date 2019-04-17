<?php

class WP_Test_Jetpack_Shortcodes_Dailymotion extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_exists() {
		$this->assertEquals( shortcode_exists( 'dailymotion' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion() {
		$content = '[dailymotion]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_id() {
		$id = 'x8oma9';
		$content = '[dailymotion id=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_missing_id() {
		$content = '[dailymotion]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<!--Dailymotion error: bad or missing ID-->', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_title() {
		$id = 'x8oma9';
		$title = '2';
		$content = '[dailymotion id=' . $id . ' title=' . $title . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_user() {
		$id = 'x8oma9';
		$user = '3';
		$content = '[dailymotion id=' . $id . ' user=' . $user . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_video() {
		$id = 'x8oma9';
		$video = '4';
		$content = '[dailymotion id=' . $id . ' video=' . $video . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $id, $shortcode_content );
	}

	/**
	 * @author mathildes
	 * @covers ::dailymotion_shortcode
	 * @since 4.2.0
	 */
	public function test_shortcodes_dailymotion_width_height() {
		$video_id = 'x8oma9';
		$width = '350';
		$height = '500';
		$content = '[dailymotion id=' . $video_id . ' width=' . $width . ' height=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );
	}

		/**
	 * @author mathildes
	 * @covers ::dailymotion_shortcode
	 * @since 4.2.0
	 */
	public function test_shortcodes_dailymotion_params() {
		// only testing a subset of params
		$video_id = 'x8oma9';
		$content = '[dailymotion id='
			. $video_id
			. ' autoplay=1 endscreen-enable=0 mute=1 sharing-enable=0 start=45 subtitles-default=en ui-highlight=ffcc33 ui-logo=0 ui-start-screen-info=0 ui-theme=dark]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $video_id, $shortcode_content );
		$this->assertContains( 'autoplay=1', $shortcode_content );
		$this->assertContains( 'endscreen-enable=0', $shortcode_content );
		$this->assertContains( 'mute=1', $shortcode_content );
		$this->assertContains( 'sharing-enable=0', $shortcode_content );
		$this->assertContains( 'start=45', $shortcode_content );
		$this->assertContains( 'subtitles-default=en', $shortcode_content );
		$this->assertContains( 'ui-highlight=ffcc33', $shortcode_content );
		$this->assertContains( 'ui-logo=0', $shortcode_content );
		$this->assertContains( 'ui-start-screen-info=0', $shortcode_content );
		$this->assertContains( 'ui-theme=dark', $shortcode_content );
	}

}
