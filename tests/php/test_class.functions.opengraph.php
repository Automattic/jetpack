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

	/**
	 * Test potential descriptions given to OG description.
	 *
	 * @dataProvider jetpack_og_get_description_data_provider
	 *
	 * @param string $description Post description.
	 * @param string $cleaned_description Description cleaned up and ready to be used.
	 */
	public function test_jetpack_og_get_description_default( $description, $cleaned_description ) {
		// A test shortcode that should be removed from descriptions.
		add_shortcode(
			'foo',
			function() {
				return 'bar';
			}
		);

		$processed_description = jetpack_og_get_description( $description );

		$this->assertEquals(
			$cleaned_description,
			$processed_description
		);
	}

	/**
	 * Potential descriptions given to OG description.
	 */
	public function jetpack_og_get_description_data_provider() {
		return array(
			'empty'                  => array(
				'',
				'Visit the post for more.',
			),
			'no_entities'            => array(
				"OpenGraph's test",
				'OpenGraph&#8217;s test',
			),
			'too_many_words'         => array(
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur quam eget finibus consectetur. Donec sollicitudin finibus massa, ut cursus elit. Mauris dictum quam eu ullamcorper feugiat. Proin id ante purus. Aliquam lorem libero, tempus id dictum non, feugiat vel eros. Sed sed viverra libero. Praesent eu lacinia felis, et tempus turpis. Proin bibendum, ligula. These last sentence should be removed.',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur quam eget finibus consectetur. Donec sollicitudin finibus massa, ut cursus elit. Mauris dictum quam eu ullamcorper feugiat. Proin id ante purus. Aliquam lorem libero, tempus id dictum non, feugiat vel eros. Sed sed viverra libero. Praesent eu lacinia felis, et tempus turpis. Proin bibendum, ligula.&hellip;',
			),
			'no_tags'                => array(
				'A post description<script>alert("hello");</script>',
				'A post description',
			),
			'no_shortcodes'          => array(
				'[foo test="true"]A post description',
				'A post description',
			),
			'no_links'               => array(
				'A post description https://jetpack.com',
				'A post description',
			),
			'no_html'                => array(
				'<strong>A post description</strong>',
				'A post description',
			),
			'image_then_text'        => array(
				'<img src="https://example.org/jetpack-icon.jpg" />A post description',
				'A post description',
			),
			'linked_image_then_text' => array(
				'<a href="https://jetpack.com"><img src="https://example.org/jetpack-icon.jpg" /></a>A post description',
				'A post description',
			),
		);
	}
}
