import formatDuration from '../../../helpers/format-duration.js';

const tests = [
	[ 0, '0.000' ],
	[ 1, '0.001' ],
	[ 999, '0.999' ],
	[ 1000, '1.000' ],
	[ 59999, '59.999' ],
	[ 60000, '1:00.000' ],
	[ 3599999, '59:59.999' ],
	[ 3600000, '1:00:00.000' ],
	[ 86399999, '23:59:59.999' ],
	[ 86400000, '24:00:00.000' ],
	[ -1, '-0.001' ],
	[ -1000, '-1.000' ],
	[ -60000, '-1:00.000' ],
	[ 0.0000000005, '0.000' ],
];

describe( 'format-duration', () => {
	test.each( tests )( `formats %d`, ( val, expected ) => {
		expect( formatDuration( val ) ).toBe( expected );
	} );
} );
