<?php

class WP_Test_Jetpack_Photon extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::instance
	 * @since 3.2
	 */
	public function test_photon_instance() {
		$this->assertInstanceOf( 'Jetpack_Photon', Jetpack_Photon::instance() );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::instance
	 * @since 3.2
	 */
	public function test_photon_instance_singleton() {
		$photon = Jetpack_Photon::instance();

		$this->assertEquals( $photon, Jetpack_Photon::instance() );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_empty() {
		$content = '';

		$this->assertEmpty( Jetpack_Photon::parse_images_from_html( $content ) );
	}

	/**
	 * @author scotchfield
	 * @return array
	 * @since 3.2
	 */
	private function get_photon_sample_content( $filename ) {
		$full_filename = dirname( __FILE__ ) . '/modules/photon/sample-content/' . $filename;

		$file_contents = file_get_contents( $full_filename );

		return explode( "\n--RESULTS--\n", $file_contents, 2 );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_a_tags_without_images() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_empty_a_tag() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'empty-a-tag.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_extra_attributes() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'extra-attributes.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum_multiple_with_links() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum-multiple-with-links.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum_multiple() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum-multiple.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_multiline() {
	       list( $sample_html, $expected ) = $this->get_photon_sample_content( 'multiline.html' );

	       $this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_no_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here.jpg';

		$this->assertEquals( array( FALSE, FALSE ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_no_dimensions_letter() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-2xM.jpg';

		$this->assertEquals( array( FALSE, FALSE ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_invalid_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-0x4.jpg';

		$this->assertEquals( array( FALSE, FALSE ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_valid_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-148x148.jpg';

		$this->assertEquals( array( 148, 148 ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_valid_large_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-123456789x123456789.jpg';

		$this->assertEquals( array( 123456789, 123456789 ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

}
