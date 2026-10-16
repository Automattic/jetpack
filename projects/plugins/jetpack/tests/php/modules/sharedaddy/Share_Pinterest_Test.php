<?php
/**
 * Tests for the Pinterest sharing source.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources.php';

/**
 * Tests the Pinterest sharing source.
 */
class Share_Pinterest_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Pinterest sharing source.
	 *
	 * @var Share_Pinterest
	 */
	private $pinterest;

	/**
	 * Image URL returned for the post.
	 *
	 * @var string
	 */
	private $image_src;

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->pinterest = new Share_Pinterest( 'pinterest', array() );
		add_filter( 'jetpack_images_pre_get_images', array( $this, 'post_images' ) );
	}

	/**
	 * Ensure the AMP button passes the post image, so Pinterest does not ask the visitor to upload one.
	 */
	public function test_get_amp_display_includes_media() {
		$this->image_src = 'https://example.com/pin.jpg';

		$markup = $this->pinterest->get_amp_display( self::factory()->post->create_and_get() );

		$this->assertStringStartsWith( '<amp-social-share type="pinterest"', $markup );
		$this->assertStringContainsString( 'data-param-media="https://example.com/pin.jpg"', $markup );
	}

	/**
	 * Ensure the AMP media URL is escaped for its attribute.
	 */
	public function test_get_amp_display_escapes_media() {
		$this->image_src = 'https://example.com/a.jpg" onclick="alert(1)';

		$markup = $this->pinterest->get_amp_display( self::factory()->post->create_and_get() );

		$this->assertStringContainsString( 'data-param-media="https://example.com/a.jpg&quot; onclick=&quot;alert(1)"', $markup );
		$this->assertStringNotContainsString( '" onclick="', $markup );
	}

	/**
	 * Ensure nothing is rendered outside a post.
	 */
	public function test_get_amp_display_without_post() {
		$this->assertFalse( $this->pinterest->get_amp_display( null ) );
	}

	/**
	 * Return a single image for the post.
	 *
	 * @return array[]
	 */
	public function post_images() {
		return array(
			array(
				'type' => 'image',
				'src'  => $this->image_src,
			),
		);
	}
}
