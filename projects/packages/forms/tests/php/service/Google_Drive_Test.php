<?php
/**
 * Unit tests for the Google Drive service helper.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Google_Drive.
 *
 * @covers Automattic\Jetpack\Forms\Service\Google_Drive
 */
#[CoversClass( Google_Drive::class )]
class Google_Drive_Test extends BaseTestCase {

	/**
	 * Spreadsheet references and the ID each should yield.
	 *
	 * @return array
	 */
	public static function data_sheet_references() {
		return array(
			'edit URL'            => array(
				'https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit#gid=0',
				'1AbC-dEf_123',
			),
			'no trailing path'    => array(
				'https://docs.google.com/spreadsheets/d/1AbC-dEf_123',
				'1AbC-dEf_123',
			),
			'query string'        => array(
				'https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit?usp=sharing',
				'1AbC-dEf_123',
			),
			'surrounding spaces'  => array(
				'  https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit  ',
				'1AbC-dEf_123',
			),
			'bare ID'             => array( '1AbC-dEf_123', '1AbC-dEf_123' ),
			'a docs URL, not a sheet' => array( 'https://docs.google.com/document/d/1AbC-dEf_123/edit', null ),
			'unrelated URL'       => array( 'https://example.com/nope', null ),
			'too short to be an ID' => array( 'abc', null ),
			'empty'               => array( '', null ),
		);
	}

	/**
	 * A pasted spreadsheet link has to resolve to an ID before we can look it up.
	 *
	 * @dataProvider data_sheet_references
	 *
	 * @param string      $reference The URL or ID under test.
	 * @param string|null $expected  The expected spreadsheet ID.
	 */
	#[DataProvider( 'data_sheet_references' )]
	public function test_extract_sheet_id( $reference, $expected ) {
		$this->assertSame( $expected, Google_Drive::extract_sheet_id( $reference ) );
	}
}
