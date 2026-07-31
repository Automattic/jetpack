<?php
/**
 * Tests that reading the Terms of Service option seeds an autoloaded default when absent.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Terms_Of_Service
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * @package Automattic\Jetpack
 * @covers \Automattic\Jetpack\Terms_Of_Service
 */
#[CoversClass( Terms_Of_Service::class )]
class Terms_Of_Service_Seeding_Test extends TestCase {

	const OPTION = 'jetpack_tos_agreed';

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
	}

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
	 * When the option is absent, the read returns false and persists an autoloaded default so
	 * it is not re-queried on subsequent requests (JETPACK-1539).
	 */
	public function test_seeds_autoloaded_default_when_option_absent() {
		// Precondition: the option does not exist.
		$this->assertSame( 'MISSING', get_option( self::OPTION, 'MISSING' ) );

		$this->assertFalse( $this->read() );

		// The option now exists (was seeded), so future reads come from cache, not the DB.
		$this->assertNotSame( 'MISSING', get_option( self::OPTION, 'MISSING' ) );
		$this->assertArrayHasKey( self::OPTION, wp_load_alloptions(), 'Seeded option should be autoloaded.' );
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
