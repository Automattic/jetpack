<?php
/**
 * Class with PHPUnit tests for Open Graph functions.
 *
 * @since 3.9.2
 */
class WP_Test_Functions_OpenGraph extends Jetpack_Attachment_Test_Case {

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

}