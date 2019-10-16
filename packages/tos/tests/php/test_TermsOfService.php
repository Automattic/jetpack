<?php


namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

class Test_TermsOfService extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->terms_of_service = new TermsOfService();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		unset( $this->manager );
		Constants::clear_constants();
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\TermsOfService::agree
	 */
	public function test_agree() {

		$this->assertFalse( $this->terms_of_service->has_agreed() );
		$this->terms_of_service->agree();

		// check that the do_action has run.
		$this->assertTrue( $this->terms_of_service->has_agreed() );

	}

	/**
	 * @covers Automattic\Jetpack\TermsOfService::has_agreed
	 */
	public function test_has_agreed_after_the_site_agrees() {
		$this->terms_of_service->agree();
		$this->assertTrue( $this->terms_of_service->has_agreed() );
	}

	/**
	 * @covers Automattic\Jetpack\TermsOfService::has_agreed
	 */
	public function test_has_agreed_is_development_mode() {
		$this->terms_of_service->agree();
		// TODO: Set the site in dev mode.
		$this->assertFalse( $this->terms_of_service->has_agreed() );
	}

	/**
	 * @covers Automattic\Jetpack\TermsOfService::has_agreed
	 */
	public function test_has_agreed_is_active_mode() {
		$this->terms_of_service->agree();
		// TODO: Set the site in disconnected mode
		$this->assertFalse( $this->terms_of_service->has_agreed() );
	}

}
