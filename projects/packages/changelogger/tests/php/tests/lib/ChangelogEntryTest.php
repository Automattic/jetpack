<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelog ChangelogEntry class.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelog\ChangelogEntry;
use DateTime;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the changelog ChangelogEntry class.
 *
 * @covers \Automattic\Jetpack\Changelog\ChangelogEntry
 */
class ChangelogEntryTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test general getters.
	 */
	public function testGetters() {
		$then  = new DateTime( 'now' );
		$entry = new ChangelogEntry( '1.0' );
		$now   = new DateTime( 'now' );
		$this->assertSame( '1.0', $entry->getVersion() );
		$this->assertGreaterThanOrEqual( $then, $entry->getTimestamp() );
		$this->assertLessThanOrEqual( $now, $entry->getTimestamp() );
		$this->assertSame( null, $entry->getLink() );
		$this->assertSame( '', $entry->getPrologue() );
		$this->assertSame( '', $entry->getEpilogue() );

		$this->assertSame( $entry, $entry->setVersion( '2.0' )->setTimestamp( null )->setPrologue( 'Foo' )->setEpilogue( 'Bar' )->setLink( 'https://example.org' ) );
		$this->assertSame( 'https://example.org', $entry->getLink() );
		$this->assertSame( '2.0', $entry->getVersion() );
		$this->assertSame( 'Foo', $entry->getPrologue() );
		$this->assertSame( 'Bar', $entry->getEpilogue() );
		$this->assertNull( $entry->getTimestamp() );

		$this->assertSame( $entry, $entry->setVersion( 111 )->setPrologue( 222 )->setEpilogue( 333 )->setLink( '' ) );
		$this->assertSame( '111', $entry->getVersion() );
		$this->assertSame( null, $entry->getLink() );
		$this->assertSame( '222', $entry->getPrologue() );
		$this->assertSame( '333', $entry->getEpilogue() );

		$entry = new ChangelogEntry(
			'1.0',
			array(
				'version'   => '2.0',
				'prologue'  => 'XXX',
				'timestamp' => '2021-02-12',
			)
		);
		$this->assertSame( '1.0', $entry->getVersion() );
		$this->assertSame( 'XXX', $entry->getPrologue() );
		$this->assertSame( '2021-02-12 00:00:00', $entry->getTimestamp()->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * Test changes.
	 */
	public function testChanges() {
		$entry   = new ChangelogEntry( '1.0' );
		$changes = array(
			new ChangeEntry(
				array(
					'subheading' => 'A',
					'content'    => '14',
				)
			),
			new ChangeEntry(
				array(
					'subheading' => 'B',
					'content'    => '2',
				)
			),
			new ChangeEntry(
				array(
					'subheading' => 'B',
					'content'    => '8',
				)
			),
			new ChangeEntry(
				array(
					'subheading' => 'C',
					'content'    => '6',
				)
			),
		);

		$this->assertSame( array(), $entry->getChanges() );
		$this->assertSame( array(), $entry->getChangesBySubheading() );
		$this->assertSame( array(), $entry->getChangesBySubheading( 'B' ) );

		$this->assertSame( $entry, $entry->setChanges( $changes ) );
		$this->assertSame( $changes, $entry->getChanges() );
		$this->assertSame(
			array(
				'A' => array( $changes[0] ),
				'B' => array( $changes[1], $changes[2] ),
				'C' => array( $changes[3] ),
			),
			$entry->getChangesBySubheading()
		);
		$this->assertSame( array( $changes[1], $changes[2] ), $entry->getChangesBySubheading( 'B' ) );

		$c1 = new ChangeEntry(
			array(
				'subheading' => 'B',
				'content'    => '5',
			)
		);
		$c2 = new ChangeEntry(
			array(
				'subheading' => 'B',
				'content'    => '5',
			)
		);
		$c3 = new ChangeEntry(
			array(
				'subheading' => 'X',
				'content'    => '1',
			)
		);
		$this->assertSame( $entry, $entry->insertChange( $c1 ) );
		$this->assertSame( $entry, $entry->insertChange( $c2, array( 'ordering' => array( 'content' ) ) ) );
		$this->assertSame( $entry, $entry->insertChange( $c3 ) );
		$this->assertSame( array( $c2, $changes[0], $changes[1], $c1, $changes[2], $changes[3], $c3 ), $entry->getChanges() );
		$this->assertSame(
			array(
				'B' => array( $c2, $changes[1], $c1, $changes[2] ),
				'A' => array( $changes[0] ),
				'C' => array( $changes[3] ),
				'X' => array( $c3 ),
			),
			$entry->getChangesBySubheading()
		);
		$this->assertSame( array( $c2, $changes[1], $c1, $changes[2] ), $entry->getChangesBySubheading( 'B' ) );

		$entry = new ChangelogEntry( '1.0' );
		$this->assertSame( $entry, $entry->appendChange( $c1 )->appendChange( $c2 )->appendChange( $c3 ) );
		$this->assertSame( array( $c1, $c2, $c3 ), $entry->getChanges() );
	}

	/**
	 * Test constructor error.
	 */
	public function testConstructor_error() {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::__construct: Unrecognized data item "foo"' );
		new ChangelogEntry( '1.0', array( 'foo' => 'bar' ) );
	}

	/**
	 * Test setVersion error.
	 */
	public function testSetVersion_error() {
		$entry = new ChangelogEntry( '1.0' );
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::setVersion: Version may not be empty' );
		$entry->setVersion( '' );
	}

	/**
	 * Test setLink error.
	 */
	public function testSetLink_error() {
		$entry = new ChangelogEntry( '1.0' );
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::setLink: Invalid URL' );
		$entry->setLink( '/bogus' );
	}

	/**
	 * Test setTimestamp error.
	 */
	public function testSetTimestamp_error() {
		$entry = new ChangelogEntry( '1.0' );
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::setTimestamp: Invalid timestamp' );
		$entry->setTimestamp( 'bogus' );
	}

	/**
	 * Test setChanges error.
	 */
	public function testSetChanges_error1() {
		$entry = new ChangelogEntry( '1.0' );
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::setChanges: Expected a ChangeEntry, got NULL at index 0' );
		$entry->setChanges( array( null ) );
	}

	/**
	 * Test setChanges error.
	 */
	public function testSetChanges_error2() {
		$entry = new ChangelogEntry( '1.0' );
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangelogEntry::setChanges: Expected a ChangeEntry, got Automattic\\Jetpack\\Changelog\\ChangelogEntry at index 0' );
		$entry->setChanges( array( $entry ) );
	}

	/**
	 * Test JSON serialization.
	 *
	 * @dataProvider provideJson
	 * @param string                $json JSON data.
	 * @param ChangelogEntry|string $entry Changelog entry, or error message if decoding should fail.
	 */
	public function testJson( $json, $entry ) {
		if ( is_string( $entry ) ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $entry );
			ChangelogEntry::jsonUnserialize( json_decode( $json ) );
		} else {
			$this->assertSame( $json, json_encode( $entry ) );
			$this->assertEquals( $entry, ChangelogEntry::jsonUnserialize( json_decode( $json ) ) );
		}
	}

	/**
	 * Data provider for testJson.
	 */
	public function provideJson() {
		return array(
			'Basic serialization'               => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangelogEntry","version":"1.0","link":null,"timestamp":"2021-02-18T00:00:00+0000","prologue":"","epilogue":"","changes":[]}',
				( new ChangelogEntry( '1.0' ) )->setTimestamp( '2021-02-18' ),
			),
			'Serialization with data'           => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangelogEntry","version":"1.0","link":"https:\\/\\/example.org","timestamp":"2021-02-18T12:07:16-0500","prologue":"Foo","epilogue":"Bar","changes":[{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":null,"timestamp":"2021-02-17T00:00:00+0000","subheading":"","author":"","content":""},{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":null,"timestamp":"2021-02-18T00:00:00+0000","subheading":"","author":"","content":""}]}',
				( new ChangelogEntry( '1.0' ) )->setTimestamp( '2021-02-18T12:07:16-0500' )->setPrologue( 'Foo' )->setEpilogue( 'Bar' )->setLink( 'https://example.org' )->setChanges(
					array(
						new ChangeEntry( array( 'timestamp' => '2021-02-17' ) ),
						new ChangeEntry( array( 'timestamp' => '2021-02-18' ) ),
					)
				),
			),
			'Serialization with null timestamp' => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangelogEntry","version":"1.0","link":null,"timestamp":null,"prologue":"","epilogue":"","changes":[]}',
				new ChangelogEntry( '1.0', array( 'timestamp' => null ) ),
			),
			'Bad unserialization, no class'     => array(
				'{"version":"1.0","link":null,"timestamp":"2021-02-18T00:00:00+0000","prologue":"","epilogue":"","changes":[]}',
				'Invalid data',
			),
			'Bad unserialization, no version'   => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangelogEntry","link":null,"timestamp":"2021-02-18T00:00:00+0000","prologue":"","epilogue":"","changes":[]}',
				'Invalid data',
			),
			'Bad unserialization, wrong class'  => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\Changelog","version":"1.0","prologue":"","epilogue":"","entries":[]}',
				'Cannot instantiate Automattic\\Jetpack\\Changelog\\Changelog via Automattic\\Jetpack\\Changelog\\ChangelogEntry::jsonUnserialize',
			),
		);
	}

}
