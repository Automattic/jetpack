<?php
/**
 * Scaffold smoke test.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Verifies the WorDBless test environment is wired up.
 */
class Scaffold_Test extends TestCase {

	/**
	 * Options round-trip through the WorDBless-backed wpdb.
	 */
	public function test_environment_is_wired() {
		update_option( 'jetpack_cookie_consent_scaffold_probe', 'ok' );
		$this->assertSame( 'ok', get_option( 'jetpack_cookie_consent_scaffold_probe' ) );
	}
}
