import { parseTimecode } from '../parse-timecode';
import { formatTimecode } from '../state/time-utils';

describe( 'parseTimecode', () => {
	it.each( [
		[ '0:01:05.3', 65300 ],
		[ '1:00:00.0', 3600000 ],
		[ '01:05', 65000 ],
		[ '1:05', 65000 ],
		[ '0:00', 0 ],
		[ '90', 90000 ],
		[ '12.5', 12500 ],
		[ '0', 0 ],
		[ '  1:05  ', 65000 ],
		[ '1:05.25', 65250 ],
	] )( 'parses %s as %i ms', ( input, expected ) => {
		expect( parseTimecode( input ) ).toBe( expected );
	} );

	it.each( [ '', '   ', 'abc', '1:2:3:4', '1:75', '1:75:00', '01:05:', ':30', '1:0 5', '-5' ] )(
		'rejects %s',
		input => {
			expect( parseTimecode( input ) ).toBeNull();
		}
	);

	it( 'rejects seconds >= 60 only when minutes are present', () => {
		expect( parseTimecode( '75' ) ).toBe( 75000 );
		expect( parseTimecode( '0:75' ) ).toBeNull();
	} );

	it( 'rejects minutes >= 60 only when hours are present', () => {
		expect( parseTimecode( '90:00' ) ).toBe( 5400000 );
		expect( parseTimecode( '1:90:00' ) ).toBeNull();
	} );

	it( 'round-trips formatTimecode output', () => {
		for ( const ms of [ 0, 100, 999, 65300, 3600000, 5025900 ] ) {
			expect( parseTimecode( formatTimecode( ms ) ) ).toBe( ms - ( ms % 100 ) );
		}
	} );
} );
