<?php

class WP_Test_Jetpack_Photon extends Jetpack_Attachment_Test_Case {
	protected static $test_image;

	protected $_globals;

	public function setUp() {
		parent::setUp();

		// Preserving global variables
		global $content_width;
		$this->_globals['content_width'] = $content_width;

		// Setup the Photon filters.
		// WP_UnitTestCase resets the action/filter state after
		// every test:
		// https://core.trac.wordpress.org/browser/trunk/tests/phpunit/includes/testcase.php?rev=43005#L273
		// So we need to set these Photon filters for each test.
		// see ::tearDown() ...
		Jetpack_Photon::instance();
	}

	public function tearDown() {
		// Restoring global variables
		global $content_width;
		$content_width = $this->_globals['content_width'];

		// ... see ::setUp()
		// Unfortunately Jetpack_Photon::instance() won't run Jetpack_Photon->setup()
		// each time Jetpack_Photon::instance() is called, since it's gated by a
		// static variable.
		// l337 h4X0Ring required:
		$instance = new ReflectionProperty( 'Jetpack_Photon', '__instance' );
		$instance->setAccessible( true );
		$instance->setValue( null );

		parent::tearDown();
	}

	/**
	 * Helper to get a query string part from the data returned by the filter_image_downsize method
	 *
	 * @author zinigor
	 * @since 3.8.2
	 * @param Array $data an array of data returned by the filter
	 * @return String $query_string
	 */
	protected function _get_query( $data ) {
		$fragments = explode( '?', $data[0], 2 );
		return $fragments[1];
	}

	protected function _get_image( $size = 'large', $meta = true ) {
		if ( 'large' == $size ) { // 1600x1200
			$filename = dirname( __FILE__ ) . '/modules/photon/sample-content/test-image-large.png';
		}
		elseif ( 'medium' == $size ) { // 1024x768
			$filename = dirname( __FILE__ ) . '/modules/photon/sample-content/test-image-medium.png';
		}
		// Add sizes that exist before uploading the file.
		add_image_size( 'jetpack_soft_defined', 700, 500, false ); // Intentionally not a 1.33333 ratio.
		add_image_size( 'jetpack_soft_undefined', 700, 99999, false );
		add_image_size( 'jetpack_soft_undefined_zero', 700, 0, false );
		add_image_size( 'jetpack_hard_defined', 700, 500, true );
		add_image_size( 'jetpack_hard_undefined', 700, 99999, true );
		add_image_size( 'jetpack_hard_undefined_zero', 700, 0, true );
		add_image_size( 'jetpack_soft_oversized', 2000, 2000, false );

		$test_image = self::_create_upload_object( $filename, 0, $meta );

		// add sizes that did not exist when the file was uploaded.
		// These perfectly match the above and Photon should treat them the same.
		add_image_size( 'jetpack_soft_defined_after_upload', 700, 500, false ); // Intentionally not a 1.33333 ratio.
		add_image_size( 'jetpack_soft_undefined_after_upload', 700, 99999, false );
		add_image_size( 'jetpack_soft_undefined_zero_after_upload', 700, 0, false );
		add_image_size( 'jetpack_hard_defined_after_upload', 700, 500, true );
		add_image_size( 'jetpack_hard_undefined_after_upload', 700, 99999, true );
		add_image_size( 'jetpack_hard_undefined_zero_after_upload', 700, 0, true );
		add_image_size( 'jetpack_soft_oversized_after_upload', 2000, 2000, false );

		return $test_image;
	}

	protected function _remove_image_sizes(){
		remove_image_size( 'jetpack_soft_defined' );
		remove_image_size( 'jetpack_soft_undefined' );
		remove_image_size( 'jetpack_soft_undefined_zero' );
		remove_image_size( 'jetpack_hard_defined' );
		remove_image_size( 'jetpack_hard_undefined' );
		remove_image_size( 'jetpack_hard_undefined_zero' );
		remove_image_size( 'jetpack_soft_defined_after_upload' );
		remove_image_size( 'jetpack_soft_undefined_after_upload' );
		remove_image_size( 'jetpack_soft_undefined_zero_after_upload' );
		remove_image_size( 'jetpack_hard_defined_after_upload' );
		remove_image_size( 'jetpack_hard_undefined_after_upload' );
		remove_image_size( 'jetpack_hard_undefined_zero_after_upload' );
		remove_image_size( 'jetpack_soft_oversized' );
		remove_image_size( 'jetpack_soft_oversized_after_upload' );
	}

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
	 * @author ccprog
	 * @covers Jetpack_Photon::parse_images_from_html
	 */
	public function test_photon_parse_images_from_html_src_attribute() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'src-attribute.html' );

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

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_full_size_dimensions() {
		$test_image = $this->_get_image();

		// Should be the same as the original image. No crop.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'full' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_large_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using the default "Large" size with a soft crop.
		$this->assertEquals(
			'fit=1024%2C768',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'large' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author emilyatmobtown
	 * @covers Jetpack_Photon::filter_image_downsize
	 */
	public function test_photon_return_medium_large_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using the default "Large" size with a soft crop.
		$this->assertEquals(
			'fit=768%2C576',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'medium_large' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_defined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined height and width.
		$this->assertEquals(
			'fit=667%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_zero_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_zero' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_defined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C1200',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_zero_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width, any height.
		$this->assertEquals(
			'resize=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_zero' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_defined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined height and width.
		$this->assertEquals(
			'fit=667%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_zero_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_zero_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_defined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C1200',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_zero_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C525',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_zero_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_custom_size_array_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Declaring the size array directly, unknown size of 400 by 400. Scaled, it should be 400 by 300.
		$this->assertEquals(
			'fit=400%2C300',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 400, 400 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_custom_size_array_dimensions_larger_than_original() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'medium' ); // Original 1024x768

		// Declaring the size array directly, unknown size of 1200 by 1200. Should return original.
		$this->assertEquals(
			'fit=1024%2C768',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 1200, 1200 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_defined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined height and width.
		$this->assertEquals(
			'fit=700%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_oversized() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_oversized' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_undefined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C99999',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_oversized_after_upload() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_oversized_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_hard_defined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_hard_undefined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C99999',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_custom_size_array_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->_get_image( 'large', false );

		// Declaring the size array directly, unknown size of 400 by 400. Scaled, it should be 400 by 300.
		$this->assertEquals(
			'fit=400%2C400',
			$this->_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 400, 400 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->_remove_image_sizes();
	}

	/**
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 5.6.0
	 */
	public function test_photon_filter_the_content_does_not_remove_width_height_when_both_known() {
		list( $sample_html ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$first_line = strtok( $filtered_content, "\n" ); // Should contain an image tag on the first line
		$attributes = wp_kses_hair( $first_line, wp_allowed_protocols() );

		$this->assertArrayHasKey( 'width', $attributes );
		$this->assertArrayHasKey( 'height', $attributes );

		// These values obtained from first image in sample content
		$this->assertEquals( 631, $attributes['width']['value'] );
		$this->assertEquals( 376, $attributes['height']['value'] );
	}

	/**
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 5.6.0
	 */
	public function test_photon_filter_the_content_does_not_have_width_height_when_at_least_one_not_known() {
		$sample_html = '<img class="aligncenter  wp-image-6372" title="Tube Bomber salmon dry fly" alt="Tube Bomber salmon dry fly" src="http://www.fishmadman.com/pages/wp-content/uploads/2012/02/Rav-fra-2004-2009-11-1024x611.jpg" width="631" />';
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes = wp_kses_hair( $filtered_content, wp_allowed_protocols() );

		$this->assertArrayNotHasKey( 'width', $attributes );
		$this->assertArrayNotHasKey( 'height', $attributes );
		$this->assertContains( 'data-recalc-dims', $filtered_content );
	}

	/**
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @dataProvider photon_attributes_when_filtered_data_provider
	 * @since 5.6.0
	 */
	public function test_photon_filter_the_content_width_height_attributes_when_image_args_filtered( $filter_callback, $has_attributes, $width, $height ) {
		list( $sample_html ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );

		add_filter( 'jetpack_photon_post_image_args', $filter_callback, 10, 2 );
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		remove_filter( 'jetpack_photon_post_image_args', $filter_callback, 10, 2 );

		$first_line = strtok( $filtered_content, "\n" ); // Should contain an image tag on the first line
		$attributes = wp_kses_hair( $first_line, wp_allowed_protocols() );

		if ( $has_attributes ) {
			$this->assertArrayHasKey( 'width', $attributes );
			$this->assertArrayHasKey( 'height', $attributes );

			// These values obtained from first image in sample content
			$this->assertEquals( $width, $attributes['width']['value'] );
			$this->assertEquals( $height, $attributes['height']['value'] );
		} else {
			$this->assertArrayNotHasKey( 'width', $attributes );
			$this->assertArrayNotHasKey( 'height', $attributes );
		}
	}

	public function photon_attributes_when_filtered_data_provider() {
		$that = $this; // For sake of PHP 5.3.

		$assert_details = function ( $details ) use ( $that ) {
			$that->assertInternalType( 'array', $details );
			$that->assertArrayHasKey( 'tag', $details );
			$that->assertArrayHasKey( 'src', $details );
			$that->assertArrayHasKey( 'src_orig', $details );
			$that->assertArrayHasKey( 'width', $details );
			$that->assertArrayHasKey( 'width_orig', $details );
			$that->assertArrayHasKey( 'height', $details );
			$that->assertArrayHasKey( 'height_orig', $details );
			$that->assertArrayHasKey( 'transform', $details );
			$that->assertArrayHasKey( 'transform_orig', $details );
		};

		return array(
			'photon_post_image_args_force_resize' => array(
				function( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'resize' => '300,250'
					);
				},
				true,
				300,
				250
			),
			'photon_post_image_args_force_fit' => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'fit' => '600,600'
					);
				},
				true,
				600,
				600
			),
			'photon_post_image_args_force_lb' => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'lb' => '800,100,000000'
					);
				},
				true,
				800,
				100
			),
			'photon_post_image_args_force_width_only' => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'w' => '104'
					);
				},
				false,
				false,
				false
			),
		);
	}

	/**
	 * @author westonruter
	 * @covers Jetpack_Photon::filter_the_content
	 * @dataProvider photon_attributes_when_amp_response
	 * @since 7.6.0
	 *
	 * @param string $sample_html Sample HTML.
	 * @param string $photon_src  Photon URL suffix (after the subdomain).
	 */
	public function test_photon_filter_the_content_for_amp_responses( $sample_html, $photon_src ) {
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes = wp_kses_hair( $filtered_content, wp_allowed_protocols() );
		$this->assertStringEndsWith( $photon_src, html_entity_decode( $attributes['src']['value'] ) );
		$this->assertArrayHasKey( 'width', $attributes );
		$this->assertArrayHasKey( 'height', $attributes );
		$this->assertNotContains( 'data-recalc-dims', $filtered_content );
	}

	/**
	 * Data provider for testing AMP responses.
	 *
	 * @return array
	 */
	public function photon_attributes_when_amp_response() {
		return array(
			'amp-img' => array(
				'<amp-img class="aligncenter wp-image-6372" title="Tube Bomber salmon dry fly" alt="Tube Bomber salmon dry fly" src="http://www.fishmadman.com/pages/wp-content/uploads/2012/02/Rav-fra-2004-2009-11-1024x611.jpg" width="102" height="61"></amp-img>',
				'.wp.com/www.fishmadman.com/pages/wp-content/uploads/2012/02/Rav-fra-2004-2009-11-1024x611.jpg?resize=102%2C61',
			),
			'amp-anim' => array(
				'<amp-anim alt="LOL" src="https://example.com/lol.gif" width="32" height="32"></amp-anim>',
				'.wp.com/example.com/lol.gif?resize=32%2C32&ssl=1',
			),
		);
	}

	/**
	 * @author westonruter
	 * @covers Jetpack_Photon::filter_the_content
	 * @covers Jetpack_AMP_Support::filter_photon_post_image_args_for_stories
	 * @since 7.6.0
	 */
	public function test_photon_filter_the_content_for_amp_story() {
		$post_type = 'amp_story';
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		register_post_type( $post_type, array( 'public' => true ) );
		Jetpack_AMP_Support::init();
		$post = $this->factory()->post->create_and_get( compact( 'post_type' ) );
		$this->go_to( get_permalink( $post ) );
		$this->assertTrue( is_singular( $post_type ) );

		$content = implode(
			"\n",
			array(
				'<!-- wp:amp/amp-story-page {"mediaId":2414,"mediaType":"image","focalPoint":{"x":0.4900990099009901,"y":0.5131578947368421}} -->',
				'<amp-story-page style="background-color:#ffffff" id="a6c81a13-14a0-464b-88fa-9612e86bacf7" class="wp-block-amp-amp-story-page"><amp-story-grid-layer template="fill"><amp-img layout="fill" src="https://example.com/wp-content/uploads/2019/06/huge.jpg" style="object-position:49.00990099009901% 51.31578947368421%"></amp-img></amp-story-grid-layer><amp-story-grid-layer template="fill"></amp-story-grid-layer></amp-story-page>',
				'<!-- /wp:amp/amp-story-page -->',
			)
		);

		$filtered_content = apply_filters( 'the_content', $content, $post->ID );

		$this->assertContains(
			'.wp.com/example.com/wp-content/uploads/2019/06/huge.jpg?h=1280&#038;ssl=1',
			$filtered_content
		);

		unregister_post_type( $post_type );
	}

	/**
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_view_context() {
		$test_image = $this->_get_image();

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertContains( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertContains( '?', $data['media_details']['sizes']['medium_large']['source_url'] );
		}

	/**
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_edit_context() {
		$test_image = $this->_get_image();

		$admin = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'edit' ) );
		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertNotContains( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertNotContains( '?', $data['media_details']['sizes']['medium_large']['source_url'] );


		// Subsequent ?context=view requests should still be Photonized
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$response = rest_get_server()->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertContains( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertContains( '?', $data['media_details']['sizes']['medium_large']['source_url'] );
	}

	/**
	 * @covers Jetpack_Photon::strip_image_dimensions_maybe
	 */
	public function test_photon_strip_image_dimensions_maybe_ignores_external_files() {
		$ext_domain = 'https://some.domain/wp-content/uploads/2019/1/test-image-300x300.jpg';

		$this->assertEquals( $ext_domain, Jetpack_Photon::strip_image_dimensions_maybe( $ext_domain ) );
	}

	/**
	 * @covers Jetpack_Photon::strip_image_dimensions_maybe
	 */
	public function test_photon_strip_image_dimensions_maybe_strips_resized_string() {
		$orig_filename = '2004-07-22-DSC_0007.jpg';
		$filename = '2004-07-22-DSC_0007-150x150.jpg';
		$filepath = DIR_TESTDATA . '/images/' . $orig_filename;
		$contents = file_get_contents( $filepath );

		$upload = wp_upload_bits( basename( $filepath ), null, $contents );

		$upload_dir = wp_get_upload_dir();

		$id  = $this->_make_attachment( $upload );
		$url = $upload_dir['url'] . '/' . $filename;

		$expected = wp_get_attachment_url( $id );

		$this->assertEquals( $expected, Jetpack_Photon::strip_image_dimensions_maybe( $url ) );

		wp_delete_attachment( $id );
	}
}
