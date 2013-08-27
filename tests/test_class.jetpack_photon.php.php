<?php

/**
 * @todo UPDATE ALL THE TESTS IN HERE! - blobaugh
 */
class WP_Test_Jetpack_Photon extends PHPUnit_Framework_TestCase {

	/**
	 * @comment This test is horrible because it runs multiple tests inside this one method. - blobaugh
	 * @author unknown
	 * @pre-2.3.3
	 */
	function test_parse_images_from_html() {
		$directory = __DIR__ . '/modules/photon/sample-content';

		$files = glob( $directory . '/' . '*.html' );

		foreach ( $files as $file ) {
			$file_contents = file_get_contents( $file );
			list( $sample_html, $expected ) = explode( "\n--RESULTS--\n", $file_contents, 2 );
			$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
		}
	}

	/**
	 * @author unknown
	 * @since pre-2.3.3
	 * @return array
	 */
	function urls_and_dimensions() {
		return array(
			array( 'http://www.example.com/no-dimensions-here.jpg', array( false, false ) ),
			array( 'http://www.example.com/no-dimensions-here-2xM.jpg', array( false, false ) ),
			array( 'http://www.example.com/invalid-dimensions-0x4.jpg', array( false, false ) ),
			array( 'http://www.example.com/wp-content/uploads/2012/05/quickdissipating1-148x148.jpg', array( 148, 148 ) ),
			array( 'http://www.example.com/wp-content/uploads/2012/05/quickdissipating1-123456789x1.jpg', array( 123456789, 1 ) ),
		);
	}

	/**
	 * @author unknown
	 * @since pre-2.3.3
	 * @dataProvider urls_and_dimensions
	 */
	function test_parse_dimensions_from_filename( $image_url, $expected_dimensions ) {
		$this->assertEquals( $expected_dimensions, Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}
}