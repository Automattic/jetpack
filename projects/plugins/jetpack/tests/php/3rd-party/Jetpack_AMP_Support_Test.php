<?php
/**
 * Test class for Jetpack_AMP_Support.
 *
 * @package automattic/jetpack
 */

/**
 * Include the code to test.
 */
require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-amp-support.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';

/**
 * Class Jetpack_AMP_Support_Test
 */
class Jetpack_AMP_Support_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Setup tests.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_is_amp_request', '__return_true' );
	}

	/**
	 * Clean up tests.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_is_amp_request', '__return_true' );
		parent::tear_down();
	}

	/**
	 * Test rendering AMP social icons.
	 */
	public function test_render_sharing_html() {
		global $post;
		$post = self::factory()->post->create_and_get( array( 'post_title' => 'Test post' ) );

		// Facebook.
		$services = array(
			'visible' => array(
				'facebook' => new Share_Facebook( 'facebook', array() ),
			),
		);

		$social_icons = Jetpack_AMP_Support::render_sharing_html( '<div class="sd-content"><ul><li>Facebook</li></ul></div>', $services );

		$this->assertEquals( '<div class="sd-content"><amp-social-share type="facebook" height="32px" width="32px" aria-label="Share on Facebook" title="Share on Facebook" data-param-app_id="249643311490"></amp-social-share></div>', $social_icons );

		// Print.
		$services = array(
			'visible' => array(
				'print' => new Share_Print( 'print', array() ),
			),
		);

		$social_icons = Jetpack_AMP_Support::render_sharing_html( '<div class="sd-content"><ul><li>Print</li></ul></div>', $services );

		$this->assertEquals( '<div class="sd-content"><button class="amp-social-share print" on="tap:AMP.print">Print</button></div>', $social_icons );

		// Whatsapp.
		$services = array(
			'visible' => array(
				'jetpack-whatsapp' => new Jetpack_Share_WhatsApp( 'jetpack-whatsapp', array() ),
			),
		);

		$social_icons = Jetpack_AMP_Support::render_sharing_html( '<div class="sd-content"><ul><li>Whatsapp</li></ul></div>', $services );

		$this->assertEquals( '<div class="sd-content"><amp-social-share type="whatsapp" height="32px" width="32px" aria-label="Share on WhatsApp" title="Share on WhatsApp"></amp-social-share></div>', $social_icons );

		// Reset global post.
		$post = null;
	}
}
