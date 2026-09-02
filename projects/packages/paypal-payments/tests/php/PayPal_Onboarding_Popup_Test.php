<?php
/**
 * Tests for the PayPal_Onboarding_Popup class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class PayPal_Onboarding_Popup_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_Onboarding_Popup
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Onboarding_Popup
 */
#[CoversClass( PayPal_Onboarding_Popup::class )]
class PayPal_Onboarding_Popup_Test extends BaseTestCase {

	/**
	 * The popup URL points at the admin-post action, carrying a nonce.
	 */
	public function test_get_url_targets_the_admin_post_action() {
		$url = PayPal_Onboarding_Popup::get_url();

		$this->assertStringContainsString( 'admin-post.php', $url );
		$this->assertStringContainsString( 'action=' . PayPal_Onboarding_Popup::ACTION, $url );

		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
		$this->assertArrayHasKey( '_wpnonce', $query );
		$this->assertSame( 1, wp_verify_nonce( $query['_wpnonce'], PayPal_Onboarding_Popup::ACTION ) );
	}

	/**
	 * The popup is reachable, which is what lets the editor open it.
	 */
	public function test_init_registers_the_admin_post_handler() {
		PayPal_Onboarding_Popup::init();

		$this->assertNotFalse(
			has_action( 'admin_post_' . PayPal_Onboarding_Popup::ACTION, array( PayPal_Onboarding_Popup::class, 'handle' ) )
		);
	}

	/**
	 * The channel name is a contract with edit.jsx, which listens on it for the
	 * auth code; a rename on one side alone silently breaks onboarding.
	 */
	public function test_broadcast_channel_matches_the_editor() {
		$editor = file_get_contents( __DIR__ . '/../../src/paypal-payment-buttons/edit.jsx' );

		$this->assertStringContainsString(
			"const ONBOARDING_CHANNEL = '" . PayPal_Onboarding_Popup::CHANNEL . "'",
			$editor
		);
	}
}
