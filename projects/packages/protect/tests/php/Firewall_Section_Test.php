<?php
/**
 * Tests for the Protect dashboard's Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Firewall;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The WAF package isn't installed here, as on a site whose firewall predates the self-check.
 *
 * @covers \Automattic\Jetpack\Protect\Sections\Firewall
 */
#[CoversClass( Firewall::class )]
class Firewall_Section_Test extends BaseTestCase {

	public function test_start_test_fails_cleanly_without_the_self_check() {
		$result = Firewall::start_test();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'firewall_test_unavailable', $result->get_error_code() );
	}

	public function test_recent_blocks_are_empty_without_the_blocklog_reader() {
		$this->assertSame( array(), Firewall::get_recent_blocks() );
	}
}
