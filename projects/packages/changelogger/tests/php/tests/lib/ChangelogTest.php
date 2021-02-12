<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelog Changelog class.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\Changelog;
use Automattic\Jetpack\Changelog\ChangelogEntry;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the changelog Changelog class.
 *
 * @covers \Automattic\Jetpack\Changelog\Changelog
 */
class ChangelogTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test prologue and epilogue.
	 */
	public function testPrologueAndEpilogue() {
		$changelog = new Changelog();
		$this->assertSame( '', $changelog->getPrologue() );
		$this->assertSame( '', $changelog->getEpilogue() );

		$this->assertSame( $changelog, $changelog->setPrologue( 'Foo' )->setEpilogue( 'Bar' ) );
		$this->assertSame( 'Foo', $changelog->getPrologue() );
		$this->assertSame( 'Bar', $changelog->getEpilogue() );

		$this->assertSame( $changelog, $changelog->setPrologue( 123 )->setEpilogue( 456 ) );
		$this->assertSame( '123', $changelog->getPrologue() );
		$this->assertSame( '456', $changelog->getEpilogue() );
	}

	/**
	 * Test entries.
	 */
	public function testEntries() {
		$changelog = new Changelog();
		$entries   = array(
			4 => new ChangelogEntry( '4.0' ),
			3 => new ChangelogEntry( '3.0' ),
			2 => new ChangelogEntry( '2.0' ),
			1 => new ChangelogEntry( '1.0' ),
		);

		$this->assertSame( array(), $changelog->getEntries() );
		$this->assertSame( null, $changelog->getLatestEntry() );
		$this->assertSame( array(), $changelog->getVersions() );
		$this->assertSame( null, $changelog->findEntryByVersion( '2.0' ) );
		$this->assertSame(
			array(),
			$changelog->findEntriesByVersions(
				array(
					'>=' => '2.0',
					'<'  => '4.0',
				)
			)
		);

		$e = $changelog->addEntry();
		$this->assertInstanceOf( ChangelogEntry::class, $e );
		$this->assertSame( '0.0.1-dev', $e->getVersion() );

		$this->assertSame( array( $e ), $changelog->getEntries() );
		$this->assertSame( $e, $changelog->getLatestEntry() );
		$this->assertSame( array( '0.0.1-dev' ), $changelog->getVersions() );
		$this->assertSame( null, $changelog->findEntryByVersion( '2.0' ) );
		$this->assertSame(
			array(),
			$changelog->findEntriesByVersions(
				array(
					'>=' => '2.0',
					'<'  => '4.0',
				)
			)
		);

		$this->assertSame( $changelog, $changelog->setEntries( $entries ) );
		$this->assertSame( array_values( $entries ), $changelog->getEntries() );
		$this->assertSame( $entries[4], $changelog->getLatestEntry() );
		$this->assertSame( array( '4.0', '3.0', '2.0', '1.0' ), $changelog->getVersions() );
		$this->assertSame( $entries[2], $changelog->findEntryByVersion( '2.0' ) );
		$this->assertSame(
			array( $entries[3], $entries[2] ),
			$changelog->findEntriesByVersions(
				array(
					'>=' => '2.0',
					'<'  => '4.0',
				)
			)
		);

		$e1 = $changelog->addEntry();
		$this->assertInstanceOf( ChangelogEntry::class, $e1 );
		$this->assertSame( '4.0-p1', $e1->getVersion() );
		$e2 = $changelog->addEntry();
		$this->assertInstanceOf( ChangelogEntry::class, $e2 );
		$this->assertSame( '4.0-p2', $e2->getVersion() );
		$e2->setVersion( '4.0-dev+pl_123' );
		$e3 = $changelog->addEntry();
		$this->assertInstanceOf( ChangelogEntry::class, $e3 );
		$this->assertSame( '4.0-dev+pl_124', $e3->getVersion() );
		$this->assertSame( array_merge( array( $e3, $e2, $e1 ), array_values( $entries ) ), $changelog->getEntries() );
		$this->assertSame( $e3, $changelog->getLatestEntry() );
		$this->assertSame( array( '4.0-dev+pl_124', '4.0-dev+pl_123', '4.0-p1', '4.0', '3.0', '2.0', '1.0' ), $changelog->getVersions() );
		$this->assertSame( $entries[2], $changelog->findEntryByVersion( '2.0' ) );
		$this->assertSame(
			array( $e3, $e2, $entries[3], $entries[2] ),
			$changelog->findEntriesByVersions(
				array(
					'>=' => '2.0',
					'<'  => '4.0',
				)
			)
		);
	}

	/**
	 * Test setEntries error.
	 */
	public function testSetEntries_error1() {
		$changelog = new Changelog();
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\Changelog::setEntries: Expected a ChangelogEntry, got NULL at index 0' );
		$changelog->setEntries( array( null ) );
	}

	/**
	 * Test setEntries error.
	 */
	public function testSetEntries_error2() {
		$changelog = new Changelog();
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\Changelog::setEntries: Expected a ChangelogEntry, got Automattic\\Jetpack\\Changelog\\Changelog at index 0' );
		$changelog->setEntries( array( $changelog ) );
	}

}
