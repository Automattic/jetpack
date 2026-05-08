<?php
/**
 * Subscriptions Block rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/views.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Subscriptions Block Rendering tests.
 *
 * @covers ::Automattic\Jetpack\Extensions\Subscriptions\render_for_website
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Subscriptions\render_for_website' )]
class Subscriptions_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test render_for_website exposes the custom success message to frontend code.
	 */
	public function test_render_for_website_includes_custom_success_message_in_form() {
		\Jetpack_Subscriptions_Widget::$instance_count = 1;

		$result = \Automattic\Jetpack\Extensions\Subscriptions\render_for_website(
			array(
				'widget_id'                         => 1,
				'subscribe_email'                   => '',
				'is_paid_subscriber'                => false,
				'wrapper_attributes'                => 'class="wp-block-jetpack-subscriptions"',
				'subscribe_placeholder'             => 'Type your email',
				'submit_button_text'                => 'Subscribe',
				'submit_button_text_subscribed'     => 'Subscribed',
				'submit_button_text_upgrade'        => 'Upgrade subscription',
				'success_message'                   => 'Custom subscription success.',
				'show_subscribers_total'            => false,
				'subscribers_total'                 => 0,
				'referer'                           => 'https://example.org/post',
				'source'                            => 'subscribe-block',
				'app_source'                        => null,
				'class_name'                        => '',
				'selected_newsletter_categories'    => array(),
				'preselected_newsletter_categories' => false,
			),
			array(),
			array()
		);

		$this->assertStringContainsString( 'name="success_message"', $result );
		$this->assertStringContainsString( 'value="Custom subscription success."', $result );
	}
}
