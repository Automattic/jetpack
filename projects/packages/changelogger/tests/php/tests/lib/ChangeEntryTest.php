<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelog ChangeEntry class.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\ChangeEntry;
use DateTime;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the changelog ChangeEntry class.
 *
 * @covers \Automattic\Jetpack\Changelog\ChangeEntry
 */
class ChangeEntryTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test general getters.
	 */
	public function testGetters() {
		$then   = new DateTime( 'now' );
		$change = new ChangeEntry();
		$now    = new DateTime( 'now' );
		$this->assertGreaterThanOrEqual( $then, $change->getTimestamp() );
		$this->assertLessThanOrEqual( $now, $change->getTimestamp() );
		$this->assertSame( null, $change->getSignificance() );
		$this->assertSame( '', $change->getSubheading() );
		$this->assertSame( '', $change->getAuthor() );
		$this->assertSame( '', $change->getContent() );

		$this->assertSame( $change, $change->setSignificance( 'patch' )->setAuthor( 'me!' )->setSubheading( 'Foo' )->setContent( 'Bar' ) );
		$this->assertSame( 'patch', $change->getSignificance() );
		$this->assertSame( 'Foo', $change->getSubheading() );
		$this->assertSame( 'me!', $change->getAuthor() );
		$this->assertSame( 'Bar', $change->getContent() );

		$this->assertSame( $change, $change->setSignificance( null )->setAuthor( 111 )->setSubheading( 222 )->setContent( 333 ) );
		$this->assertSame( null, $change->getSignificance() );
		$this->assertSame( '111', $change->getAuthor() );
		$this->assertSame( '222', $change->getSubheading() );
		$this->assertSame( '333', $change->getContent() );

		$change = new ChangeEntry(
			array(
				'significance' => 'minor',
				'author'       => 'that guy',
				'subheading'   => 'Things',
				'content'      => 'Stuff',
				'timestamp'    => '2021-02-16',
			)
		);
		$this->assertSame( 'minor', $change->getSignificance() );
		$this->assertSame( 'Things', $change->getSubheading() );
		$this->assertSame( 'that guy', $change->getAuthor() );
		$this->assertSame( 'Stuff', $change->getContent() );
		$this->assertSame( '2021-02-16 00:00:00', $change->getTimestamp()->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * Test constructor error.
	 */
	public function testConstructor_error() {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangeEntry::__construct: Unrecognized data item "foo"' );
		new ChangeEntry( array( 'foo' => 'bar' ) );
	}

	/**
	 * Test setTimestamp error.
	 */
	public function testSetTimestamp_error() {
		$change = new ChangeEntry();
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangeEntry::setTimestamp: Invalid timestamp' );
		$change->setTimestamp( 'bogus' );
	}

	/**
	 * Test setSignificance error.
	 */
	public function testSetSignificance_error() {
		$change = new ChangeEntry();
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( "Automattic\\Jetpack\\Changelog\\ChangeEntry::setSignificance: Significance must be 'patch', 'minor', or 'major' (or null)" );
		$change->setSignificance( 'bogus' );
	}

	/**
	 * Test compare.
	 *
	 * @dataProvider provideCompare
	 * @param ChangeEntry $a First change entry.
	 * @param ChangeEntry $b Second change entry.
	 * @param array       $config Compare config.
	 * @param int         $expect Expected value.
	 */
	public function testCompare( ChangeEntry $a, ChangeEntry $b, array $config, $expect ) {
		$ret = ChangeEntry::compare( $a, $b, $config );
		// We only care about the sign of the return value.
		$ret = $ret < 0 ? -1 : ( $ret > 0 ? 1 : 0 );
		$this->assertSame( $expect, $ret );

		$ret = ChangeEntry::compare( $b, $a, $config );
		// We only care about the sign of the return value.
		$ret = $ret < 0 ? -1 : ( $ret > 0 ? 1 : 0 );
		$this->assertSame( -$expect, $ret );
	}

	/**
	 * Data provider for testCompare.
	 */
	public function provideCompare() {
		return array(
			'Default config, equal'                        => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'Head',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'A change.',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'Head',
						'author'       => 'YYY',
						'timestamp'    => '2020-02-02',
						'content'      => 'A change.',
					)
				),
				array(),
				0,
			),
			'Default config, equal but for case'           => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'Head',
						'author'       => 'Xxx',
						'timestamp'    => '2020-01-01',
						'content'      => 'A change.',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'hEAD',
						'author'       => 'xXX',
						'timestamp'    => '2020-02-02',
						'content'      => 'a CHANGE.',
					)
				),
				array(
					'ordering' => array( 'subheading', 'author', 'content' ),
				),
				0,
			),
			'Default config, subheading before content'    => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'A',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'B',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'B',
						'author'       => 'YYY',
						'timestamp'    => '2020-01-01',
						'content'      => 'A',
					)
				),
				array(),
				-1,
			),
			'Default config, content differs'              => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'Head',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'B',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'Head',
						'author'       => 'YYY',
						'timestamp'    => '2020-02-02',
						'content'      => 'A',
					)
				),
				array(),
				1,
			),
			'Add timestamp to config'                      => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'Head',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'B',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'Head',
						'author'       => 'YYY',
						'timestamp'    => '2020-02-02',
						'content'      => 'A',
					)
				),
				array(
					'ordering' => array( 'subheading', 'timestamp', 'content' ),
				),
				-1,
			),
			'Add significance to config'                   => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'Head',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'B',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'patch',
						'subheading'   => 'Head',
						'author'       => 'YYY',
						'timestamp'    => '2020-02-02',
						'content'      => 'A',
					)
				),
				array(
					'ordering' => array( 'subheading', 'significance', 'content' ),
				),
				-1,
			),
			'Use knownSubheadings'                         => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'AAA',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'BBB',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				array(
					'knownSubheadings' => array( 'BBB', 'AAA' ),
				),
				1,
			),
			'Use knownSubheadings, case mismatch'          => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'aAa',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'AaA',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				array(
					'knownSubheadings' => array( 'BBB', 'AAA' ),
				),
				0,
			),
			'Use knownSubheadings, one subheading unknown' => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'AAA?',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'BBB',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				array(
					'knownSubheadings' => array( 'AAA', 'BBB' ),
				),
				1,
			),
			'Use knownSubheadings, both subheadings unknown' => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'AAA?',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'BBB?',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				array(
					'knownSubheadings' => array( 'BBB', 'AAA' ),
				),
				-1,
			),
			'Use knownSubheadings, empty subheading cannot be known' => array(
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => '',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				new ChangeEntry(
					array(
						'significance' => 'major',
						'subheading'   => 'BBB',
						'author'       => 'XXX',
						'timestamp'    => '2020-01-01',
						'content'      => 'Content',
					)
				),
				array(
					'knownSubheadings' => array( 'BBB', 'AAA', '' ),
				),
				-1,
			),
		);
	}

	/**
	 * Test compare error.
	 */
	public function testCompare_error() {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Automattic\\Jetpack\\Changelog\\ChangeEntry::compare: Invalid field in ordering' );
		ChangeEntry::compare(
			new ChangeEntry(),
			new ChangeEntry(),
			array(
				'ordering' => array( 'subheading', 'bogus', 'content' ),
			)
		);
	}

	/**
	 * Test JSON serialization.
	 *
	 * @dataProvider provideJson
	 * @param string             $json JSON data.
	 * @param ChangeEntry|string $change Change entry, or error message if decoding should fail.
	 */
	public function testJson( $json, $change ) {
		if ( is_string( $change ) ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $change );
			ChangeEntry::jsonUnserialize( json_decode( $json ) );
		} else {
			$this->assertSame( $json, json_encode( $change ) );
			$this->assertEquals( $change, ChangeEntry::jsonUnserialize( json_decode( $json ) ) );
		}
	}

	/**
	 * Data provider for testJson.
	 */
	public function provideJson() {
		return array(
			'Basic serialization'              => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":null,"timestamp":"2021-02-18T00:00:00+0000","subheading":"","author":"","content":""}',
				( new ChangeEntry() )->setTimestamp( '2021-02-18' ),
			),
			'Serialization with data'          => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\ChangeEntry","significance":"minor","timestamp":"2021-02-18T12:07:16-0500","subheading":"Heading","author":"Me!","content":"A change."}',
				( new ChangeEntry() )->setTimestamp( '2021-02-18T12:07:16-0500' )->setSignificance( 'minor' )->setSubheading( 'Heading' )->setAuthor( 'Me!' )->setContent( 'A change.' ),
			),
			'Bad unserialization, no class'    => array(
				'{"significance":"minor","timestamp":"2021-02-18T12:07:16-0500","subheading":"Heading","author":"Me!","content":"A change."}',
				'Invalid data',
			),
			'Bad unserialization, wrong class' => array(
				'{"__class__":"Automattic\\\\Jetpack\\\\Changelog\\\\Changelog","prologue":"","epilogue":"","entries":[]}',
				'Cannot instantiate Automattic\\Jetpack\\Changelog\\Changelog via Automattic\\Jetpack\\Changelog\\ChangeEntry::jsonUnserialize',
			),
		);
	}

}
