<?php
/**
 * Class with PHPUnit tests for Open Graph functions.
 *
 * @since 3.9.2
 */
class WP_Test_Functions_OpenGraph extends WP_UnitTestCase {

	/**
	 * Include Open Graph functions before each test.
	 *
	 * @since 3.9.2
	 */
	public function setUp() {
		require_once JETPACK__PLUGIN_DIR . 'functions.opengraph.php';
	}

	/**
	 * @author automattic
	 * @covers ::jetpack_og_get_image
	 * @since  3.9.2
	 */
	public function test_jetpack_og_get_image_default() {
		$image_url = jetpack_og_get_image();
		$this->assertEquals( is_array( $image_url ), true );
	}

	/**
	 * @author automattic
	 * @covers ::jetpack_og_get_image
	 * @since  3.9.2
	 */
	public function test_jetpack_og_get_site_icon_and_logo_url() {

		$test_icon_id = self::_create_upload_object( dirname( __FILE__ ) . '/jetpack-icon.jpg' );

		// Test Jetpack's Site Logo
		update_option( 'site_logo', array( 'id' => $test_icon_id, 'url' => wp_get_attachment_url( $test_icon_id ) ) );
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/functions.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/class-site-logo.php';
		$image_url = jetpack_og_get_image();
		$this->assertEquals( $image_url['src'], jetpack_get_site_logo( 'url' ) );

		// Test core's Site Icon
		update_option( 'site_icon', $test_icon_id );
		$image_url = jetpack_og_get_image();
		$this->assertEquals( $image_url['src'], get_site_icon_url( 512 ) );
		delete_option( 'site_icon' );

		wp_delete_attachment( $test_icon_id );
	}

	/**
	 * A helper to create an upload object. This method was copied verbatim from WP Core's
	 * WP_UnitTest_Factory_For_Attachment class. When Jetpack is no longer tested on Core
	 * versions older than 4.4, it can be removed and replaced with the following call:
	 *
	 *	$factory->attachment->create_upload_object( $filename );
	 *
	 * The $factory here is an instance of WP_UnitTest_Factory and is passed as an argument
	 * to wpSetUpBeforeClass method.
	 * @param String $file file path
	 * @param Integer $parent the ID of the parent object
	 * @return Integer $id
	 */
	static protected function _create_upload_object( $file, $parent = 0, $generate_meta = false ) {
		$contents = file_get_contents($file);
		$upload = wp_upload_bits(basename($file), null, $contents);

		$type = '';
		if ( ! empty($upload['type']) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ($mime)
				$type = $mime['type'];
		}

		$attachment = array(
			'post_title' => basename( $upload['file'] ),
			'post_content' => '',
			'post_type' => 'attachment',
			'post_parent' => $parent,
			'post_mime_type' => $type,
			'guid' => $upload[ 'url' ],
		);

		// Save the data
		$id = wp_insert_attachment( $attachment, $upload[ 'file' ], $parent );
		$meta = $generate_meta ? wp_generate_attachment_metadata( $id, $upload['file'] ) : false;
		wp_update_attachment_metadata( $id, $meta );

		return $id;
	}

}