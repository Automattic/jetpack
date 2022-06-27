<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Tests for Jetpack's Photon class.
 *
 * @package automattic/jetpack
 */

/**
 * Class WP_Test_Jetpack_Photon
 */
class WP_Test_Jetpack_Photon extends Jetpack_Attachment_Test_Case {

	/**
	 * Test image.
	 *
	 * @var string
	 */
	protected static $test_image;

	/**
	 * Save the existing globals.
	 *
	 * @var array
	 */
	protected $protected_globals;

	/**
	 * ID for an author-level user created by this class.
	 *
	 * @var int
	 */
	protected static $author_id;

	/**
	 * Special setups.
	 *
	 * @param Object $factory Testing factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$author_id = $factory->user->create(
			array(
				'role' => 'author',
			)
		);
	}

	/**
	 * Clean up the special sauce.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
	}

	/**
	 * Sets up the test.
	 */
	public function set_up() {
		parent::set_up();

		// Preserving global variables.
		global $content_width;
		$this->protected_globals['content_width'] = $content_width;

		// Setup the Photon filters.
		// WP_UnitTestCase resets the action/filter state after every test:
		// https://core.trac.wordpress.org/browser/trunk/tests/phpunit/includes/testcase.php?rev=43005#L273
		// So we need to set these Photon filters for each test.
		// see ::tear_down() ...
		Jetpack_Photon::instance();
	}

	/**
	 * Clean up after the test.
	 */
	public function tear_down() {
		// Restoring global variables.
		global $content_width, $wp_the_query;
		$content_width = $this->protected_globals['content_width'];
		$wp_the_query  = new WP_Query();

		// ... see ::set_up()
		// Unfortunately Jetpack_Photon::instance() won't run Jetpack_Photon->setup()
		// each time Jetpack_Photon::instance() is called, since it's gated by a
		// static variable.
		// l337 h4X0Ring required:
		$instance = new ReflectionProperty( 'Jetpack_Photon', 'instance' );
		$instance->setAccessible( true );
		$instance->setValue( null );

		/**
		 * Reset the `image_sizes` property, as it persists between class instantiations, since it's static.
		 */
		$instance = new ReflectionProperty( 'Jetpack_Photon', 'image_sizes' );
		$instance->setAccessible( true );
		$instance->setValue( null );

		parent::tear_down();
	}

	/**
	 * Helper to get a query string part from the data returned by the filter_image_downsize method
	 *
	 * @author zinigor
	 * @since 3.8.2
	 * @param array $data an array of data returned by the filter.
	 * @return String $query_string
	 */
	protected function helper_get_query( $data ) {
		$fragments = explode( '?', $data[0], 2 );
		return $fragments[1];
	}

	/**
	 * Helper to get a new image object.
	 *
	 * @param string $size Test image size. Accepts 'large' (default) or 'medium'.
	 * @param bool   $meta Meta data to pass to create_upload_object.
	 *
	 * @return int Post ID (attachment) of the image.
	 */
	protected function helper_get_image( $size = 'large', $meta = true ) {
		if ( 'large' === $size ) { // 1600x1200
			$filename = __DIR__ . '/modules/photon/sample-content/test-image-large.png';
		} elseif ( 'medium' === $size ) { // 1024x768
			$filename = __DIR__ . '/modules/photon/sample-content/test-image-medium.png';
		}
		// Add sizes that exist before uploading the file.
		add_image_size( 'jetpack_soft_defined', 700, 500, false ); // Intentionally not a 1.33333 ratio.
		add_image_size( 'jetpack_soft_undefined', 700, 99999, false );
		add_image_size( 'jetpack_soft_undefined_zero', 700, 0, false );
		add_image_size( 'jetpack_hard_defined', 700, 500, true );
		add_image_size( 'jetpack_hard_undefined', 700, 99999, true );
		add_image_size( 'jetpack_hard_undefined_zero', 700, 0, true );
		add_image_size( 'jetpack_soft_oversized', 2000, 2000, false );

		$test_image = self::create_upload_object( $filename, 0, $meta );

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

	/**
	 * Helper to remove image sizes added in helper_get_image().
	 */
	protected function helper_remove_image_sizes() {
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
	 * Tests that Photon creates a Photon instance.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::instance
	 * @since 3.2
	 */
	public function test_photon_instance() {
		$this->assertInstanceOf( 'Jetpack_Photon', Jetpack_Photon::instance() );
	}

	/**
	 * Tests that Photon creates a singleton.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::instance
	 * @since 3.2
	 */
	public function test_photon_instance_singleton() {
		$photon = Jetpack_Photon::instance();

		$this->assertEquals( $photon, Jetpack_Photon::instance() );
	}

	/**
	 * Tests Photon's HTML parsing when there is nothing to parse.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_empty() {
		$content = '';

		$this->assertEmpty( Jetpack_Photon::parse_images_from_html( $content ) );
	}

	/**
	 * Helper function to get sample content files.
	 *
	 * @author scotchfield
	 * @return array
	 * @since 3.2
	 *
	 * @param string $filename File name for sample content.
	 */
	private function get_photon_sample_content( $filename ) {
		$full_filename = __DIR__ . '/modules/photon/sample-content/' . $filename;

		// Local files only.
		$file_contents = file_get_contents( $full_filename );

		return explode( "\n--RESULTS--\n", $file_contents, 2 );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_a_tags_without_images() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author biskobe
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_a_tags_with_hash_in_href() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'a-tags-with-hash-href.html' );

		// Make sure we're not going to get any weird modifications due to auto-detected widths/heights and other props.
		$args_reset_callback = function () {
			return array();
		};
		add_filter( 'jetpack_photon_post_image_args', $args_reset_callback, 10, 0 );

		$this->assertEquals( trim( $expected ), trim( Jetpack_Photon::instance()->filter_the_content( $sample_html ) ) );

		remove_filter( 'jetpack_photon_post_image_args', $args_reset_callback );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_empty_a_tag() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'empty-a-tag.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_extra_attributes() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'extra-attributes.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum_multiple_with_links() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum-multiple-with-links.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum_multiple() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum-multiple.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's HTML parsing.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_minimum() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'minimum.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests that Photon will parse a multiline html snippet.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_images_from_html
	 * @since 3.2
	 */
	public function test_photon_parse_images_from_html_multiline() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'multiline.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon's parse of the src attribute.
	 *
	 * @author ccprog
	 * @covers Jetpack_Photon::parse_images_from_html
	 */
	public function test_photon_parse_images_from_html_src_attribute() {
		list( $sample_html, $expected ) = $this->get_photon_sample_content( 'src-attribute.html' );

		$this->assertEquals( $expected, print_r( Jetpack_Photon::parse_images_from_html( $sample_html ), true ) );
	}

	/**
	 * Tests Photon will parse the dimensions from a filename when there is no value.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_no_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here.jpg';

		$this->assertEquals( array( false, false ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * Tests Photon will parse the dimensions from a filename for an invalid value.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_no_dimensions_letter() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-2xM.jpg';

		$this->assertEquals( array( false, false ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * Tests Photon will parse the dimensions from a filename for an invalid value.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_invalid_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-0x4.jpg';

		$this->assertEquals( array( false, false ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * Tests Photon will parse the dimensions from a filename for a small value.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_valid_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-148x148.jpg';

		$this->assertEquals( array( 148, 148 ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * Tests Photon will parse the dimensions from a filename for a large value.
	 *
	 * @author scotchfield
	 * @covers Jetpack_Photon::parse_dimensions_from_filename
	 * @since 3.2
	 */
	public function test_photon_parse_dimensions_from_filename_valid_large_dimensions() {
		$image_url = 'http://' . WP_TESTS_DOMAIN . '/no-dimensions-here-123456789x123456789.jpg';

		$this->assertEquals( array( 123456789, 123456789 ), Jetpack_Photon::parse_dimensions_from_filename( $image_url ) );
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a full-size image.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_full_size_dimensions() {
		$test_image = $this->helper_get_image();

		// Should be the same as the original image. No crop.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'full' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_large_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using the default "Large" size with a soft crop.
		$this->assertEquals(
			'fit=1024%2C768',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'large' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author emilyatmobtown
	 * @covers Jetpack_Photon::filter_image_downsize
	 */
	public function test_photon_return_medium_large_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using the default "Large" size with a soft crop.
		$this->assertEquals(
			'fit=768%2C576',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'medium_large' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_defined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined height and width.
		$this->assertEquals(
			'fit=667%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_zero_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_zero' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_defined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C1200',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for a known size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_zero_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width, any height.
		$this->assertEquals(
			'resize=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_zero' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_defined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined height and width.
		$this->assertEquals(
			'fit=667%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_soft_undefined_zero_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded (thus unknown per WP,
		// relying solely on Photon), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined_zero_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_defined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C1200',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize filter will return accurate size for an unknown-when-uploading size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_jetpack_hard_undefined_zero_after_upload_size_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C525',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined_zero_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon image_downsize will return a custom-size image.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.8.2
	 */
	public function test_photon_return_custom_size_array_dimensions() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Declaring the size array directly, unknown size of 400 by 400. Scaled, it should be 400 by 300.
		$this->assertEquals(
			'fit=400%2C300',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 400, 400 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests that Photon will not return an image larger than the original via image_downsize.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_custom_size_array_dimensions_larger_than_original() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'medium' ); // Original 1024x768.

		// Declaring the size array directly, unknown size of 1200 by 1200. Should return original.
		$this->assertEquals(
			'fit=1024%2C768',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 1200, 1200 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests image_downsize filter for a defined size with no meta.
	 *
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_defined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined height and width.
		$this->assertEquals(
			'fit=700%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests image_downsize filter for a soft crop for an existing oversized image size.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_oversized() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded.
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_oversized' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests image_downsize filter for a soft crop for an undefined size.
	 *
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_undefined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), soft crop defined 700 width, any height.
		$this->assertEquals(
			'fit=700%2C99999',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests image_downsize filter for a soft crop after upload.
	 *
	 * @author kraftbj
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_soft_oversized_after_upload() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image();

		// Using a custom size, declared after the file was uploaded
		// (thus unknown per WP, relying solely on Photon), hard crop defined 700 width.
		$this->assertEquals(
			'fit=1600%2C1200',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_soft_oversized_after_upload' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon's image_downsize on a known image size.
	 *
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_hard_defined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined height and width.
		$this->assertEquals(
			'resize=700%2C500',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_defined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon's image_downsize filter with an undefined size.
	 *
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_jetpack_hard_undefined_size_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'large', false );

		// Using a custom size, declared before the file was uploaded (thus exists per WP), hard crop defined 700 width.
		$this->assertEquals(
			'resize=700%2C99999',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, 'jetpack_hard_undefined' ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests image_downsize filter when there is no meta information available.
	 *
	 * @author dereksmart
	 * @covers Jetpack_Photon::filter_image_downsize
	 * @since 3.9.0
	 */
	public function test_photon_return_custom_size_array_dimensions_no_meta() {
		global $content_width;
		$content_width = 0;

		$test_image = $this->helper_get_image( 'large', false );

		// Declaring the size array directly, unknown size of 400 by 400. Scaled, it should be 400 by 300.
		$this->assertEquals(
			'fit=400%2C400',
			$this->helper_get_query( Jetpack_Photon::instance()->filter_image_downsize( false, $test_image, array( 400, 400 ) ) )
		);

		wp_delete_attachment( $test_image );
		$this->helper_remove_image_sizes();
	}

	/**
	 * Tests Photon's filtering of the_content when both height/width are known.
	 *
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 5.6.0
	 */
	public function test_photon_filter_the_content_does_not_remove_width_height_when_both_known() {
		list( $sample_html ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );
		$filtered_content    = Jetpack_Photon::filter_the_content( $sample_html );
		$first_line          = strtok( $filtered_content, "\n" ); // Should contain an image tag on the first line.
		$attributes          = wp_kses_hair( $first_line, wp_allowed_protocols() );

		$this->assertArrayHasKey( 'width', $attributes );
		$this->assertArrayHasKey( 'height', $attributes );

		// These values obtained from first image in sample content.
		$this->assertEquals( 631, $attributes['width']['value'] );
		$this->assertEquals( 376, $attributes['height']['value'] );
	}

	/**
	 * Test Photon's filtering of the_content when either width/height is not known.
	 *
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 5.6.0
	 */
	public function test_photon_filter_the_content_does_not_have_width_height_when_at_least_one_not_known() {
		$sample_html      = '<img class="aligncenter  wp-image-6372" title="Tube Bomber salmon dry fly" alt="Tube Bomber salmon dry fly" src="http://www.fishmadman.com/pages/wp-content/uploads/2012/02/Rav-fra-2004-2009-11-1024x611.jpg" width="631" />';
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes       = wp_kses_hair( $filtered_content, wp_allowed_protocols() );

		$this->assertArrayNotHasKey( 'width', $attributes );
		$this->assertArrayNotHasKey( 'height', $attributes );
		$this->assertStringContainsString( 'data-recalc-dims', $filtered_content );
	}

	/**
	 * Tests Photon's filtering of the_content with filtered args.
	 *
	 * @author ebinnion
	 * @covers Jetpack_Photon::filter_the_content
	 * @dataProvider photon_attributes_when_filtered_data_provider
	 * @since 5.6.0
	 *
	 * @param callable $filter_callback Filter callback.
	 * @param bool     $has_attributes If the attributes are filtered.
	 * @param int      $width Image width in pixels.
	 * @param int      $height Image height in pixels.
	 */
	public function test_photon_filter_the_content_width_height_attributes_when_image_args_filtered( $filter_callback, $has_attributes, $width, $height ) {
		list( $sample_html ) = $this->get_photon_sample_content( 'a-tags-without-images.html' );

		add_filter( 'jetpack_photon_post_image_args', $filter_callback, 10, 2 );
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		remove_filter( 'jetpack_photon_post_image_args', $filter_callback, 10, 2 );

		$first_line = strtok( $filtered_content, "\n" ); // Should contain an image tag on the first line.
		$attributes = wp_kses_hair( $first_line, wp_allowed_protocols() );

		if ( $has_attributes ) {
			$this->assertArrayHasKey( 'width', $attributes );
			$this->assertArrayHasKey( 'height', $attributes );

			// These values obtained from first image in sample content.
			$this->assertEquals( $width, $attributes['width']['value'] );
			$this->assertEquals( $height, $attributes['height']['value'] );
		} else {
			$this->assertArrayNotHasKey( 'width', $attributes );
			$this->assertArrayNotHasKey( 'height', $attributes );
		}
	}

	/**
	 * Checks that Photon ignores data-width and data-height attributes when parsing the attributes.
	 *
	 * @author mmtr
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 8.0.0
	 */
	public function test_photon_filter_the_content_ignores_data_width_and_data_height_attributes() {
		$sample_html      = '<img src="http://example.com/test.png" class="test" data-width="100" data-height="200" />';
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes       = wp_kses_hair( $filtered_content, wp_allowed_protocols() );
		$query_str        = (string) wp_parse_url( $attributes['src']['value'], PHP_URL_QUERY );
		parse_str( $query_str, $query_params );

		$this->assertArrayNotHasKey( 'resize', $query_params );
	}

	/**
	 * Checks that Photon parses correctly the width and height attributes when they are not preceded by a space.
	 *
	 * @author mmtr
	 * @covers Jetpack_Photon::filter_the_content
	 * @since 8.0.0
	 */
	public function test_photon_filter_the_content_parses_width_height_when_no_spaces_between_attributes() {
		$sample_html      = '<img src="http://example.com/test.png" class="test"width="100"height="200" />';
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes       = wp_kses_hair( $filtered_content, wp_allowed_protocols() );
		$query_str        = wp_parse_url( $attributes['src']['value'], PHP_URL_QUERY );
		parse_str( $query_str, $query_params );

		$this->assertArrayHasKey( 'resize', $query_params );
		$this->assertEquals( '100,200', $query_params['resize'] );
	}

	/**
	 * Data provider for filtered attributes.
	 *
	 * @return array[]
	 */
	public function photon_attributes_when_filtered_data_provider() {
		$assert_details = function ( $details ) {
			$this->assertIsArray( $details );
			$this->assertArrayHasKey( 'tag', $details );
			$this->assertArrayHasKey( 'src', $details );
			$this->assertArrayHasKey( 'src_orig', $details );
			$this->assertArrayHasKey( 'width', $details );
			$this->assertArrayHasKey( 'width_orig', $details );
			$this->assertArrayHasKey( 'height', $details );
			$this->assertArrayHasKey( 'height_orig', $details );
			$this->assertArrayHasKey( 'transform', $details );
			$this->assertArrayHasKey( 'transform_orig', $details );
		};

		return array(
			'photon_post_image_args_force_resize'     => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'resize' => '300,250',
					);
				},
				true,
				300,
				250,
			),
			'photon_post_image_args_force_fit'        => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'fit' => '600,600',
					);
				},
				true,
				600,
				600,
			),
			'photon_post_image_args_force_lb'         => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'lb' => '800,100,000000',
					);
				},
				true,
				800,
				100,
			),
			'photon_post_image_args_force_width_only' => array(
				function ( $args, $details ) use ( $assert_details ) {
					$assert_details( $details );
					return array(
						'w' => '104',
					);
				},
				false,
				false,
				false,
			),
		);
	}

	/**
	 * Tests that Photon ignores percentage dimensions. It should fall back to e.g. a "size-foo" class.
	 *
	 * @covers Jetpack_Photon::filter_the_content
	 */
	public function test_photon_filter_the_content_percentage_width_and_height() {
		$sample_html      = '<img src="http://example.com/test.png" class="test size-large" width="45%" height="55%" />';
		$filtered_content = Jetpack_Photon::filter_the_content( $sample_html );
		$attributes       = wp_kses_hair( $filtered_content, wp_allowed_protocols() );
		$query_str        = wp_parse_url( $attributes['src']['value'], PHP_URL_QUERY );
		parse_str( $query_str, $query_params );

		$this->assertArrayHasKey( 'width', $attributes );
		$this->assertSame( '1024', $attributes['width']['value'] );
		$this->assertArrayHasKey( 'height', $attributes );
		$this->assertSame( '1024', $attributes['height']['value'] );

		$this->assertArrayHasKey( 'fit', $query_params );
		$this->assertEquals( '1024,1024', $query_params['fit'] );
	}

	/**
	 * Tests that Photon will filter for an AMP response.
	 *
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
		$attributes       = wp_kses_hair( $filtered_content, wp_allowed_protocols() );
		$this->assertStringEndsWith( $photon_src, html_entity_decode( $attributes['src']['value'] ) );
		$this->assertArrayHasKey( 'width', $attributes );
		$this->assertArrayHasKey( 'height', $attributes );
		$this->assertStringNotContainsString( 'data-recalc-dims', $filtered_content );
	}

	/**
	 * Data provider for testing AMP responses.
	 *
	 * @return array
	 */
	public function photon_attributes_when_amp_response() {
		return array(
			'amp-img'  => array(
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
	 * Tests that Photon will filter for AMP stories.
	 *
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

		$this->assertStringContainsString(
			'.wp.com/example.com/wp-content/uploads/2019/06/huge.jpg?h=1280&#038;ssl=1',
			$filtered_content
		);

		unregister_post_type( $post_type );
	}

	/**
	 * Tests that Photon does filter the URLs on REST API media requests in the view context.
	 *
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_view_context() {
		$test_image = $this->helper_get_image();

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertStringContainsString( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertStringContainsString( '?', $data['media_details']['sizes']['medium_large']['source_url'] );
	}

	/**
	 * Tests that Photon does not filter the URLs on REST API media requests in the view context from the editor.
	 *
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_view_context_from_editor() {
		$test_image = $this->helper_get_image();

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$request->set_header( 'x-wp-api-fetch-from-editor', 'true' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertStringNotContainsString( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertStringNotContainsString( '?', $data['media_details']['sizes']['medium_large']['source_url'] );

		// Subsequent ?context=view requests should still be Photonized.
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertStringContainsString( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertStringContainsString( '?', $data['media_details']['sizes']['medium_large']['source_url'] );
	}

	/**
	 * Tests Photon does not filter the URL on REST API media requests in the edit context.
	 *
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_edit_context() {
		$test_image = $this->helper_get_image();

		$admin = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'edit' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertStringNotContainsString( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertStringNotContainsString( '?', $data['media_details']['sizes']['medium_large']['source_url'] );

		// Subsequent ?context=view requests should still be Photonized.
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $test_image ) );
		$request->set_query_params( array( 'context' => 'view' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'full', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'medium_large', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['full'] );
		$this->assertArrayHasKey( 'source_url', $data['media_details']['sizes']['medium_large'] );

		$this->assertStringContainsString( '?', $data['media_details']['sizes']['full']['source_url'] );
		$this->assertStringContainsString( '?', $data['media_details']['sizes']['medium_large']['source_url'] );
	}

	/**
	 * Verifies that the REST API upload endpoint does not return with Photon URLs.
	 *
	 * The endpoint sets the context to edit, but not before the callback executes.

	 * @author kraftbj
	 * @requires PHPUnit 7.5
	 * @covers Jetpack_Photon::should_rest_photon_image_downsize_insert_attachment
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_with_created_item() {
		$filename = __DIR__ . '/modules/photon/sample-content/test-image-large.png';

		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-image-large.png' );

		$request->set_body( file_get_contents( $filename ) );
		// Make the REST API request.
		$response = rest_get_server()->dispatch( $request );
		// Pull the response from the API.
		$data = $response->get_data();

		// This verifies the file has uploaded. Just a bit of defensive testing.
		$this->assertEquals( 201, $response->get_status() );

		$large_url = isset( $data['media_details']['sizes']['large']['source_url'] ) ? $data['media_details']['sizes']['large']['source_url'] : false;

		if ( ! $large_url ) {
			$this->fail( 'REST API media upload failed to return the expected data.' );
		}

		$this->assertStringNotContainsString( 'wp.com', $large_url );
	}

	/**
	 * Verifies that the REST API external-media/copy endpoint does not return
	 * Photonized URLs.
	 *
	 * @author ebinnion
	 * @requires PHPUnit 7.5
	 * @covers Jetpack_Photon::should_rest_photon_image_downsize_insert_attachment
	 * @group rest-api
	 */
	public function test_photon_cdn_in_rest_response_external_media() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/external-media/copy/pexels' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{"media":[{"guid":"{\\"url\\":\\"https:\\\\\\/\\\\\\/images.pexels.com\\\\\\/photos\\\\\\/1693095\\\\\\/pexels-photo-1693095.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940\\",\\"name\\":\\"pexels-photo-1693095.jpeg\\",\\"title\\":\\"aurora lights\\",\\"caption\\":\\"Photo by Tobias Bj\\\\u00f8rkli on <a href=\\\\\\\\\\\\\\"https:\\\\\\/\\\\\\/www.pexels.com\\\\\\/photo\\\\\\/aurora-lights-1693095\\\\\\/\\\\\\\\\\\\\\" rel=\\\\\\\\\\\\\\"nofollow\\\\\\\\\\\\\\">Pexels.com<\\\\\\/a>\\"}","caption":"Photo by Tobias Bj\\u00f8rkli on <a href=\\"https:\\/\\/www.pexels.com\\/photo\\/aurora-lights-1693095\\/\\" rel=\\"nofollow\\">Pexels.com<\\/a>","title":"aurora lights"}]}' );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_mocked_download_url' ), 10, 2 );
		$response = rest_get_server()->dispatch( $request );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_mocked_download_url' ), 10, 2 );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertNotEmpty( $data );
		$this->assertIsArray( $data[0] );
		$this->assertArrayHasKey( 'url', $data[0] );
		$this->assertStringNotContainsString( 'wp.com', $data[0]['url'] );
	}

	/**
	 * This function copies a file to an expected location and then returns a successful request to support mocking download_url().
	 *
	 * @param mixed $pre  By default, this is false. We can set it to any truthy value to pre-empty the request.
	 * @param array $args An array of arguments for the request.
	 * @return array
	 */
	public function pre_http_request_mocked_download_url( $pre, $args ) {
		if ( empty( $args['filename'] ) ) {
			return $pre;
		}

		$filename = $args['filename'];

		// Delete the original file.
		unlink( $filename );

		// Copy our test image over where the file is expected.
		copy( __DIR__ . '/modules/photon/sample-content/test-image-large.png', $filename );

		// This is just a mocked response with a 200 code.
		return array(
			'headers'       => array(),
			'body'          => '',
			'response'      => array(
				'code'    => 200,
				'message' => '',
			),
			'cookies'       => array(),
			'http_response' => null,
		);
	}

	/**
	 * Tests that Photon will not strip the dimensions from an external URL.
	 *
	 * @covers Jetpack_Photon::strip_image_dimensions_maybe
	 */
	public function test_photon_strip_image_dimensions_maybe_ignores_external_files() {
		$ext_domain = 'https://some.domain/wp-content/uploads/2019/1/test-image-300x300.jpg';

		$this->assertEquals( $ext_domain, Jetpack_Photon::strip_image_dimensions_maybe( $ext_domain ) );
	}

	/**
	 * Tests Photon stripping the image dimensions from filename.
	 *
	 * @covers Jetpack_Photon::strip_image_dimensions_maybe
	 */
	public function test_photon_strip_image_dimensions_maybe_strips_resized_string() {
		$orig_filename = '2004-07-22-DSC_0007.jpg';
		$filename      = '2004-07-22-DSC_0007-150x150.jpg';
		$filepath      = DIR_TESTDATA . '/images/' . $orig_filename;
		// Local file. Okay to file_get_contents.
		$contents = file_get_contents( $filepath );

		$upload = wp_upload_bits( basename( $filepath ), null, $contents );

		$upload_dir = wp_get_upload_dir();

		$id  = $this->_make_attachment( $upload );
		$url = $upload_dir['url'] . '/' . $filename;

		$expected = wp_get_attachment_url( $id );

		$this->assertEquals( $expected, Jetpack_Photon::strip_image_dimensions_maybe( $url ) );

		wp_delete_attachment( $id );
	}

	/**
	 * Tests Photon's HTML parsing based on file type.
	 *
	 * @param string $url URL being validated.
	 * @param bool   $expected If is valid Photon-able URL.
	 *
	 * @author kraftbj
	 * @covers       Jetpack_Photon::validate_image_url
	 * @dataProvider get_test_photon_validate_image_url_file_types_data_provider
	 * @since 10.0.0
	 */
	public function test_photon_validate_image_url_file_types( $url, $expected ) {
		$testable                    = new ReflectionClass( Jetpack_Photon::class );
		$testable_validate_image_url = $testable->getMethod( 'validate_image_url' );
		$testable_validate_image_url->setAccessible( true );
		$this->assertEquals( $expected, $testable_validate_image_url->invoke( null, $url ) );
	}

	/**
	 * Possible values for test_photon_validate_image_url_file_types.
	 */
	public function get_test_photon_validate_image_url_file_types_data_provider() {
		return array(
			'gif'     => array( 'http://example.com/example-150x150.gif', true ),
			'jpg'     => array( 'http://example.com/example-150x150.jpg', true ),
			'jpeg'    => array( 'http://example.com/example-150x150.jpeg', true ),
			'png'     => array( 'http://example.com/example-150x150.png', true ),
			'webp'    => array( 'http://example.com/example-150x150.webp', true ),
			'invalid' => array( 'http://example.com/example-150x150.invalid', false ),

		);
	}
}

// phpcs:enable
