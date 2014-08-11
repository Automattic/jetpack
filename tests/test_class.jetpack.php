<?php

class WP_Test_Jetpack extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack::init
	 * @since 2.3.3
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack', Jetpack::init() );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 * @since 3.2
	 */
	public function test_sort_modules_with_equal_sort_values() {

		$first_file  = array( 'sort' => 5 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );

		$this->assertEquals( 0, $sort_value );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack::sort_modules
	 * @since 3.2
	 */
	public function test_sort_modules_with_different_sort_values() {

		$first_file  = array( 'sort' => 10 );
		$second_file = array( 'sort' => 5 );

		$sort_value = Jetpack::sort_modules( $first_file, $second_file );
		$reversed_sort_value = Jetpack::sort_modules( $second_file, $first_file );

		$this->assertEquals( 1, $sort_value );
		$this->assertEquals( -1, $reversed_sort_value );
	}

	/**
	 * @author georgestephanis
	 * @covers Jetpack::absolutize_css_urls
	 */
	public function test_absolutize_css_urls_properly_handles_use_cases() {

		$css = <<<CSS
.test-it {
	background: url(same-dir.png);
	background: url('same-dir.png');
	background: url("same-dir.png");
	background: url( same-dir.png );
	background: url( 'same-dir.png' );
	background: url( "same-dir.png" );
	background: url(		same-dir.png		);
	background: url(		'same-dir.png'	);
	background: url(		"same-dir.png"	);
	background: url(./same-dir.png);
	background: url(down/down-dir.png);
	background: url(../up-dir.png);
	background: url(../../up-2-dirs.png);
	background: url(/at-root.png);
	background: url(//other-domain.com/root.png);
	background: url(https://other-domain.com/root.png);
	background: url(data:image/gif;base64,eh129ehiuehjdhsa==);
}
CSS;

		$expected = <<<EXPECTED
.test-it {
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/same-dir.png");
	background: url("http://example.com/dir1/dir2/./same-dir.png");
	background: url("http://example.com/dir1/dir2/down/down-dir.png");
	background: url("http://example.com/dir1/dir2/../up-dir.png");
	background: url("http://example.com/dir1/dir2/../../up-2-dirs.png");
	background: url("http://example.com/at-root.png");
	background: url(//other-domain.com/root.png);
	background: url(https://other-domain.com/root.png);
	background: url(data:image/gif;base64,eh129ehiuehjdhsa==);
}
EXPECTED;

		$result = Jetpack::absolutize_css_urls( $css, 'http://example.com/dir1/dir2/style.css' );
		$this->assertEquals( $expected, $result );

	}
} // end class
