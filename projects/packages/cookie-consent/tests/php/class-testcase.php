<?php
/**
 * Base TestCase for the cookie-consent package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\TestCase as PHPUnit_TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Base TestCase: resets WorDBless state between tests.
 */
abstract class TestCase extends PHPUnit_TestCase {

	/**
	 * Set up: clear WorDBless state.
	 */
	public function setUp(): void {
		parent::setUp();
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );
	}

	/**
	 * Tear down: clear WorDBless state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );
	}
}
