<?php

require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-amp-support.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';

/**
 * Class WP_Test_Jetpack_AMP_Support
 */
class WP_Test_Jetpack_AMP_Support extends WP_UnitTestCase {

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

		$this->assertEquals( '<div class="sd-content"><amp-social-share type="facebook" height="32px" width="32px" aria-label="Click to share on Facebook" title="Click to share on Facebook" data-param-app_id="249643311490"></amp-social-share></div>', $social_icons );

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

		$this->assertEquals( '<div class="sd-content"><amp-social-share type="whatsapp" height="32px" width="32px" aria-label="Click to share on WhatsApp" title="Click to share on WhatsApp"></amp-social-share></div>', $social_icons );

		// Pocket.
		$services = array(
			'visible' => array(
				'pocket' => new Share_Pocket( 'pocket', array() ),
			),
		);

		$social_icons = Jetpack_AMP_Support::render_sharing_html( '<div class="sd-content"><ul><li>Pocket</li></ul></div>', $services );

		$this->assertEquals( '<div class="sd-content"><amp-social-share type="pocket" height="32px" width="32px" aria-label="Click to share on Pocket" title="Click to share on Pocket" data-share-endpoint="https://getpocket.com/save/?url=http%3A%2F%2Fexample.org%2F%3Fp%3D' . $post->ID . '&amp;title=Test%20post"></amp-social-share></div>', $social_icons );

		// Reset global post.
		$post = null;
	}

}
