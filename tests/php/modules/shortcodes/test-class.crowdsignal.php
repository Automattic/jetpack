<?php

class WP_Test_Jetpack_Shortcodes_CrowdSignal extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers CrowdSignal::crowdsignal_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_crowdsignal_exists() {
		$this->assertEquals( shortcode_exists( 'crowdsignal' ), true );
		$this->assertEquals( shortcode_exists( 'polldaddy' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers CrowdSignal::crowdsignal_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_crowdsignal() {
		$content = '[crowdsignal]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers CrowdSignal::crowdsignal_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_polldaddy() {
		$content = '[polldaddy]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
