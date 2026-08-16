<?php
/**
 * Tests for the shared logging helper.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Debug;
use PHPUnit\Framework\TestCase;

/**
 * Class Debug_Test
 */
class Debug_Test extends TestCase {

	/**
	 * Every message Boost logs interpolates text it did not write, and one carrying a
	 * newline writes a second line that looks exactly like a real entry (CWE-117).
	 * A single str_replace shared by every log site, so cheap to break silently.
	 */
	public function test_a_message_cannot_forge_a_second_log_entry() {
		$forged = Debug::scrub( "cache miss\n[04-Aug-2026 00:00:00 UTC] PHP Fatal error: nothing to see here" );

		$this->assertStringNotContainsString( "\n", $forged, 'A logged message must be one physical line.' );
		$this->assertStringNotContainsString( "\r", $forged, 'Including under a lone CR, which some log readers also treat as a line break.' );
	}

	/**
	 * All three line endings, since the text comes from wherever the exception did.
	 */
	public function test_every_line_ending_is_flattened() {
		$this->assertSame(
			'a b c  d',
			Debug::scrub( "a\rb\nc\r\nd" ),
			'CR, LF and CRLF must each become a space -- CRLF two, since each half is replaced.'
		);
	}

	/**
	 * Non-strings reach this from getMessage() calls on odd throwables and from
	 * interpolated integers; casting rather than fataling is deliberate.
	 */
	public function test_a_non_string_message_is_cast_rather_than_fataling() {
		$this->assertSame( '42', Debug::scrub( 42 ), 'A logging helper must not be the thing that raises a TypeError.' );
	}
}
