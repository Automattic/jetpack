import { getThreatRowActions } from '../threat-row-actions';
import type { ScanThreat } from '../types';

describe( 'getThreatRowActions', () => {
	it.each( [
		[ 'ignore', 'current' ],
		[ 'unignore', 'ignored' ],
	] )( 'offers %s only where the host lets the site ignore threats', ( id, status ) => {
		const threat = { id: 1, status } as ScanThreat;
		const isEligible = ( canIgnore: boolean ) =>
			getThreatRowActions( jest.fn(), true, canIgnore )
				.find( action => action.id === id )
				?.isEligible?.( threat );

		expect( isEligible( true ) ).toBe( true );
		expect( isEligible( false ) ).toBe( false );
	} );
} );
