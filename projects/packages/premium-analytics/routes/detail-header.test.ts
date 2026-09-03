import { formatPublishedDate, performanceSentence } from './detail-header';

describe( 'formatPublishedDate', () => {
	it( 'reads an offset-less value as site wall time', () => {
		expect( formatPublishedDate( '2026-01-10T08:00:00' ) ).toBe( 'Jan 10, 2026' );
	} );

	it.each( [ undefined, '', 'not a date', '0000-00-00 00:00:00' ] )(
		'states nothing for %p',
		value => {
			expect( formatPublishedDate( value ) ).toBeUndefined();
		}
	);
} );

describe( 'performanceSentence', () => {
	it( 'names both bounds of the committed range', () => {
		expect(
			performanceSentence( { from: new Date( 2026, 6, 9 ), to: new Date( 2026, 6, 15 ) } )
		).toBe( 'Performance from Jul 9, 2026 to Jul 15, 2026' );
	} );

	// An unparseable bound would otherwise reach `format`, which throws on it.
	it.each( [
		[ 'no range', undefined ],
		[ 'an open start', { from: undefined, to: new Date( 2026, 6, 15 ) } ],
		[ 'an open end', { from: new Date( 2026, 6, 9 ), to: undefined } ],
		[ 'an unparseable bound', { from: new Date( 'nope' ), to: new Date( 2026, 6, 15 ) } ],
	] )( 'states nothing for %s', ( _label, range ) => {
		expect( performanceSentence( range ) ).toBeUndefined();
	} );
} );
