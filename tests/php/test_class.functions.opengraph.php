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
		parent::setUp();
		$this->icon_id = self::_create_upload_object( dirname( __FILE__ ) . '/jetpack-icon.jpg', 0, true ); // 500 x 500
		require_once JETPACK__PLUGIN_DIR . 'functions.opengraph.php';
	}

	/**
	 * Include Open Graph functions after each test.
	 */
	public function tearDown() {
		parent::tearDown();
		wp_delete_attachment( $this->icon_id );
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
		$default_url = jetpack_og_get_image();

		// Test Jetpack's Site Logo
		update_option( 'site_logo', array( 'id' => $this->icon_id, 'url' => wp_get_attachment_url( $this->icon_id ) ) );
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/functions.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/class-site-logo.php';

		// Test Smaller/Invalid Jetpack's Site Logo
		$image_url = jetpack_og_get_image( 512, 512 );
		$this->assertNotEquals( jetpack_get_site_logo( 'url' ), $image_url['src'] );
		$this->assertEquals( $default_url['src'], $image_url['src'] );

		// Test Valid-sized Jetpack's Site Logo
		$image_url = jetpack_og_get_image( 200, 200 );
		$image_id = jetpack_get_site_logo( 'id' );
		$logo = wp_get_attachment_image_src( $image_id, 'full' );
		$this->assertEquals( $logo[0], $image_url['src'] );

		delete_option( 'site_logo' );
		update_option( 'site_icon', $this->icon_id );

		// Test Valid-sized core's Site Icon
		$image_url = jetpack_og_get_image( 200, 200 );
		$image_id = get_option( 'site_icon' );
		$icon = wp_get_attachment_image_src( $image_id, 'full' );
		$this->assertEquals( $icon[0], $image_url['src'] );

		delete_option( 'site_icon' );
	}
}
