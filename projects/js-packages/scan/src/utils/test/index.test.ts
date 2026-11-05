import { getThreatSeveritySortValue } from '../index.ts';

describe( 'getThreatSeveritySortValue', () => {
	it.each( [ undefined, null ] )( 'sorts a severity of %p between Low and High', severity => {
		const sorted = [ { severity: 2 }, { severity }, { severity: 3 } ].sort(
			( a, b ) => getThreatSeveritySortValue( b ) - getThreatSeveritySortValue( a )
		);
		expect( sorted.map( threat => threat.severity ) ).toEqual( [ 3, severity, 2 ] );
	} );
} );
