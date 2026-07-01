<?php
/**
 * Base TestCase for the cookie-consent package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\TestCase as PHPUnit_TestCase;
use ReflectionProperty;
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
		$this->reset_cookie_consent_config();
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
		$this->reset_cookie_consent_config();
	}

	/**
	 * Stash a resolved config on Cookie_Consent for the rest of the test.
	 *
	 * Cookie_Consent::get_config() resolves once and stashes the result, so writing
	 * the private static stash directly via reflection injects config without going
	 * through the `jetpack_cookie_consent_config` filter or a full init() boot.
	 *
	 * @param array $config Partial config to resolve and stash.
	 */
	protected function set_cookie_consent_config( array $config ) {
		$this->cookie_consent_config_property()->setValue( null, Config_Schema::resolve( $config ) );
	}

	/**
	 * Clear the Cookie_Consent config stash so the next get_config() call re-resolves.
	 */
	protected function reset_cookie_consent_config() {
		$this->cookie_consent_config_property()->setValue( null, null );
	}

	/**
	 * Get a writable reflection handle on Cookie_Consent's private config stash.
	 *
	 * @return ReflectionProperty
	 */
	private function cookie_consent_config_property() {
		$property = new ReflectionProperty( Cookie_Consent::class, 'config' );
		// setAccessible() is required to write a private property on PHP < 8.1, and a
		// deprecated no-op from 8.1 on. Call it only where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		return $property;
	}
}
