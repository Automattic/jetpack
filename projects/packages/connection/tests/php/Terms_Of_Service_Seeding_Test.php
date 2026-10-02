<?php
/**
 * Tests that reading the Terms of Service option seeds a default when absent.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Terms_Of_Service
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Terms_Of_Service
 */
#[CoversClass( Terms_Of_Service::class )]
class Terms_Of_Service_Seeding_Test extends BaseTestCase {

	const OPTION = 'jetpack_' . Terms_Of_Service::OPTION_NAME;

	/**
	 * Invoke the protected reader against a real options table.
	 *
	 * @return mixed
	 */
	private function read() {
		$method = new \ReflectionMethod( Terms_Of_Service::class, 'get_raw_has_agreed' );
		// @todo Remove this call once we no longer need to support PHP < 8.1 (no-op since 8.1, deprecated in 8.5).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( new Terms_Of_Service() );
	}

	/**
	 * When the option is absent, the read returns false, persists a false default, and a second
	 * read returns it without re-seeding. WorDBless cannot model autoload, so that the seeded row
	 * is autoloaded is verified by the manual wp-db check in the testing instructions, not here.
	 */
	public function test_seeds_default_when_option_absent() {
		$this->assertSame( 'MISSING', get_option( self::OPTION, 'MISSING' ), 'Option should start absent.' );

		$this->assertFalse( $this->read() );

		// The persisted default is false (not, say, a stray truthy value)...
		$this->assertFalse( get_option( self::OPTION ), 'Seeded value must be false.' );

		// ...and reading again returns it unchanged, without overwriting the seeded row.
		$this->assertFalse( $this->read() );
		$this->assertFalse( get_option( self::OPTION ) );
	}

	/**
	 * On the seeding request itself, the value must still come through the jetpack_options filter,
	 * not bypass it. wpcomsh/masterbar force tos_agreed to true via that filter while recording a
	 * Tracks event; returning false directly on first read would drop that event.
	 */
	public function test_seeding_read_honors_jetpack_options_filter() {
		add_filter(
			'jetpack_options',
			function ( $value, $name ) {
				return Terms_Of_Service::OPTION_NAME === $name ? true : $value;
			},
			10,
			2
		);

		$this->assertTrue( (bool) $this->read(), 'Filter override must win even on the seeding read.' );
	}

	/**
	 * A stored "agreed" value is returned as-is and never overwritten.
	 */
	public function test_returns_stored_true_without_reseeding() {
		add_option( self::OPTION, true );

		$this->assertTrue( (bool) $this->read() );
		$this->assertTrue( (bool) get_option( self::OPTION ), 'Stored value must not be overwritten.' );
	}

	/**
	 * A stored falsy value (rejected, or a previously-seeded default) is returned as-is and not
	 * re-seeded.
	 */
	public function test_returns_stored_false_without_reseeding() {
		add_option( self::OPTION, false );

		$this->assertFalse( (bool) $this->read() );
		$this->assertNotSame( 'MISSING', get_option( self::OPTION, 'MISSING' ), 'Option should remain present.' );
		$this->assertFalse( (bool) get_option( self::OPTION ) );
	}
}
