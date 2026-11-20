<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Crm;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;

/**
 * Unit tests for the CRM product.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Crm
 */
class Crm_Product_Test extends TestCase {

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		WorDBless_Options::init()->clear_options();
	}

	/**
	 * CRM's own activation hook leaves this behind, and the next admin page load it reaches
	 * is the My Jetpack screen the site owner activated it from.
	 */
	public function test_activation_clears_crms_redirect_to_its_setup_wizard() {
		add_option( 'jpcrm_do_redirect', true );

		$this->assertTrue( Crm::do_product_specific_activation( true ) );
		$this->assertFalse( get_option( 'jpcrm_do_redirect' ) );
	}

	/**
	 * A failed activation leaves CRM as it was, redirect and all.
	 */
	public function test_a_failed_activation_leaves_crm_alone() {
		add_option( 'jpcrm_do_redirect', true );
		$error = new WP_Error( 'activation_failed' );

		$this->assertSame( $error, Crm::do_product_specific_activation( $error ) );
		$this->assertNotFalse( get_option( 'jpcrm_do_redirect' ) );
	}
}
