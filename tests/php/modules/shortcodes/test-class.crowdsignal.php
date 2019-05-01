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

	/**
	 * Test a basic legacy Polldaddy poll.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_polldaddy_poll() {
		$id      = 9541291;
		$content = '[polldaddy poll=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a id="pd_a_%1$d"></a><div class="CSS_Poll PDS_Poll" id="PDI_container%1$d" style="display:inline-block;"></div><div id="PD_superContainer"></div><noscript><a href="https://polldaddy.com/p/%1$d" target="_blank">Take Our Poll</a></noscript>',
				$id
			),
			$shortcode_content
		);
	}

	/**
	 * Test a basic Crowdsignal poll.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_poll() {
		$id      = 9541291;
		$content = '[crowdsignal poll=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a id="pd_a_%1$d"></a><div class="CSS_Poll PDS_Poll" id="PDI_container%1$d" style="display:inline-block;"></div><div id="PD_superContainer"></div><noscript><a href="https://poll.fm/%1$d" target="_blank">Take Our Poll</a></noscript>',
				$id
			),
			$shortcode_content
		);
	}
}
