<?php
/**
 * Tests for the wp-build gating on the My Jetpack admin page.
 *
 * @package automattic/jetpack-my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

/**
 * Covers the modernization flag and the request-scoping helpers.
 */
class Initializer_Wp_Build_Test extends BaseTestCase {

	/**
	 * Reset the request between tests.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset( $_GET['page'], $_GET['step'] );
	}

	/**
	 * The flag is off unless a host opts in.
	 *
	 * @return void
	 */
	public function test_modernization_is_off_by_default() {
		$this->assertFalse( Initializer::is_modernized() );
	}

	/**
	 * Hosts can opt in through the documented filter.
	 *
	 * @return void
	 */
	public function test_modernization_filter_turns_it_on() {
		add_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );

		$this->assertTrue( Initializer::is_modernized() );

		remove_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );
	}

	/**
	 * Only `?page=my-jetpack` requests load wp-build.
	 *
	 * @return void
	 */
	public function test_request_scoping() {
		$this->assertFalse( Initializer::is_my_jetpack_admin_request() );

		$_GET['page'] = 'jetpack';
		$this->assertFalse( Initializer::is_my_jetpack_admin_request() );

		$_GET['page'] = 'my-jetpack';
		$this->assertTrue( Initializer::is_my_jetpack_admin_request() );
	}

	/**
	 * The onboarding takeover is excluded from wp-build.
	 *
	 * @return void
	 */
	public function test_onboarding_request_detection() {
		$_GET['page'] = 'my-jetpack';
		$this->assertFalse( Initializer::is_onboarding_request() );

		$_GET['step'] = 'onboarding';
		$this->assertTrue( Initializer::is_onboarding_request() );
	}

	/**
	 * The screen alias satisfies wp-build's enqueue check without changing the URL.
	 *
	 * @return void
	 */
	public function test_alias_screen_id() {
		set_current_screen( 'jetpack_page_my-jetpack' );
		$screen = get_current_screen();

		Initializer::alias_screen_id_for_wp_build( $screen );

		$this->assertSame( 'my-jetpack-dashboard', $screen->id );
	}

	/**
	 * A non-object screen must not fatal. WordPress passes null on screens it
	 * cannot resolve, and the `current_screen` action still fires there.
	 *
	 * @return void
	 */
	public function test_alias_screen_id_ignores_null() {
		$this->expectNotToPerformAssertions();

		Initializer::alias_screen_id_for_wp_build( null );
	}
}
