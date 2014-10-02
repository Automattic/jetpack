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

}
