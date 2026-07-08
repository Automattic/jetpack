<?php
/**
 * Smoke test proving the scaffold runs.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * @coversNothing
 */
#[CoversNothing]
class Scaffold_Test extends TestCase {

	/**
	 * WorDBless options round-trip works.
	 */
	public function test_scaffold_runs() {
		update_option( 'jetpack_cookie_consent_scaffold_probe', 'ok' );
		$this->assertSame( 'ok', get_option( 'jetpack_cookie_consent_scaffold_probe' ) );
	}
}
