<?php
/**
 * Tests for Public_Abilities.
 *
 * @package automattic/jetpack-public-abilities
 */

namespace Automattic\Jetpack\Tests;

use Automattic\Jetpack\Public_Abilities;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Public_Abilities
 */
#[CoversClass( Public_Abilities::class )]
class PublicAbilitiesTest extends TestCase {

	/**
	 * Verify get_public_abilities returns empty when wp_get_abilities is unavailable.
	 */
	public function test_returns_empty_when_abilities_api_missing() {
		// wp_get_abilities is not defined in the test environment.
		$this->assertSame( array(), Public_Abilities::get_public_abilities() );
	}

	/**
	 * Verify render_bot_discovery outputs nothing for non-bot requests.
	 */
	public function test_bot_discovery_hidden_for_non_bots() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

		ob_start();
		Public_Abilities::render_bot_discovery();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}
}
