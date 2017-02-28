<?php

class WP_Test_Jetpack_Shortcodes_Embedded_HTML_Objects extends WP_UnitTestCase {

	/**
	 * @author Toro_Unit
	 */
	public function test_wp_kses() {
		$string = '<iframe src="https://wordpress.org"></iframe>';

		$allowed_html = array(
			'a'      => array(
				'href' => true,
			),
			'iframe' => array(
				'src' => true,
			),
		);
		$actual = wp_kses( $string, $allowed_html );
		$this->assertEquals( $string, $actual );
	}

}
