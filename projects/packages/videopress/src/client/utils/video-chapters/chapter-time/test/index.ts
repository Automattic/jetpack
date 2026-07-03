/**
 * Internal dependencies
 */
import { chapterStartAtToSeconds, formatChapterTime, parseChapterTimeInput } from '../index';

describe( 'formatChapterTime', () => {
	it.each( [
		[ 0, '00:00' ],
		[ 9, '00:09' ],
		[ 84, '01:24' ],
		[ 3599, '59:59' ],
		[ 3600, '1:00:00' ],
		[ 3725, '1:02:05' ],
	] )( 'formats %d seconds as %s', ( seconds, expected ) => {
		expect( formatChapterTime( seconds ) ).toBe( expected );
	} );

	it( 'clamps negative and fractional input', () => {
		expect( formatChapterTime( -5 ) ).toBe( '00:00' );
		expect( formatChapterTime( 61.9 ) ).toBe( '01:01' );
	} );
} );

describe( 'parseChapterTimeInput', () => {
	it.each( [
		[ '0:00', 0 ],
		[ '00:00', 0 ],
		[ '1:24', 84 ],
		[ '01:24', 84 ],
		[ '1:02:05', 3725 ],
		[ ' 02:38 ', 158 ],
	] )( 'parses %s as %d seconds', ( input, expected ) => {
		expect( parseChapterTimeInput( input ) ).toBe( expected );
	} );

	it.each( [ [ '' ], [ 'abc' ], [ '1:2' ], [ '1:60' ], [ '1:00:60' ], [ '::' ], [ '90' ] ] )(
		'rejects %s',
		input => {
			expect( parseChapterTimeInput( input ) ).toBeNull();
		}
	);
} );

describe( 'chapterStartAtToSeconds', () => {
	it( 'converts the normalized HH:MM:SS startAt format', () => {
		expect( chapterStartAtToSeconds( '00:00:00' ) ).toBe( 0 );
		expect( chapterStartAtToSeconds( '00:02:38' ) ).toBe( 158 );
		expect( chapterStartAtToSeconds( '01:00:05' ) ).toBe( 3605 );
	} );
} );
