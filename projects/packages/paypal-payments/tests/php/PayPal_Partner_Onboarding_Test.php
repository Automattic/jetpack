<?php
/**
 * Tests for the PayPal_Partner_Onboarding class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Partner_Onboarding_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_Partner_Onboarding
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Partner_Onboarding
 */
#[CoversClass( PayPal_Partner_Onboarding::class )]
class PayPal_Partner_Onboarding_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_option( PayPal_Partner_Onboarding::SELLER_NONCE_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::PARTNER_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY );
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
	}

	/**
	 * Test partner ID storage and retrieval.
	 */
	public function test_partner_id_storage() {
		$this->assertEmpty( PayPal_Partner_Onboarding::get_partner_id() );

		PayPal_Partner_Onboarding::set_partner_id( 'TEST_PARTNER_123' );
		$this->assertEquals( 'TEST_PARTNER_123', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test merchant ID retrieval when not set.
	 */
	public function test_merchant_id_empty_by_default() {
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test generate_signup_link fails without partner ID.
	 */
	public function test_generate_signup_link_requires_partner_id() {
		$result = PayPal_Partner_Onboarding::generate_signup_link(
			'https://example.com/return',
			'sandbox'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_partner_id', $result->get_error_code() );
	}

	/**
	 * Test complete_onboarding fails without seller nonce.
	 */
	public function test_complete_onboarding_requires_seller_nonce() {
		$result = PayPal_Partner_Onboarding::complete_onboarding(
			'test_auth_code',
			'test_shared_id',
			'TEST_MERCHANT_ID'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_nonce', $result->get_error_code() );
	}

	/**
	 * Test check_merchant_status fails without merchant info.
	 */
	public function test_check_merchant_status_requires_merchant_info() {
		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_merchant_info', $result->get_error_code() );
	}

	/**
	 * Test cleanup removes all onboarding options.
	 */
	public function test_cleanup_removes_onboarding_data() {
		update_option( PayPal_Partner_Onboarding::SELLER_NONCE_OPTION_KEY, 'test_nonce' );
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'test_merchant' );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, 'partner_referrals' );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertFalse( get_option( PayPal_Partner_Onboarding::SELLER_NONCE_OPTION_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test cleanup does not remove partner ID (site-level config).
	 */
	public function test_cleanup_preserves_partner_id() {
		PayPal_Partner_Onboarding::set_partner_id( 'TEST_PARTNER_123' );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertEquals( 'TEST_PARTNER_123', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test onboarding products constant.
	 */
	public function test_onboarding_products() {
		$this->assertContains( 'EXPRESS_CHECKOUT', PayPal_Partner_Onboarding::ONBOARDING_PRODUCTS );
	}

	/**
	 * Test onboarding features constant.
	 */
	public function test_onboarding_features() {
		$features = PayPal_Partner_Onboarding::ONBOARDING_FEATURES;
		$this->assertContains( 'PAYMENT', $features );
		$this->assertContains( 'REFUND', $features );
		$this->assertContains( 'ACCESS_MERCHANT_INFORMATION', $features );
	}
}
