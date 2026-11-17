import { act, renderHook } from '@testing-library/react';
import { VISITS_OPTIONS } from '../../stats-section';
import { getStatsPeriodVisitsOptions, useStatsPeriod } from '../stats-card/use-stats-period';

const daysBefore = ( date: Date, days: number ) => {
	const shifted = new Date( date );
	shifted.setDate( shifted.getDate() - days );
	return shifted.toDateString();
};

describe( 'useStatsPeriod', () => {
	beforeEach( () => {
		window.localStorage.clear();
		window.JP_CONNECTION_INITIAL_STATE.userConnectionData.currentUser.id = 1;
	} );

	it.each( [ 7, 30 ] as const )( 'asks for the %d-day window it shows', days => {
		const { result } = renderHook( () => useStatsPeriod() );
		act( () => result.current.setDays( days ) );

		expect( getStatsPeriodVisitsOptions( result.current ) ).toMatchObject( {
			quantity: days,
			date: VISITS_OPTIONS.date,
		} );

		act( () => result.current.goToPrevious() );

		expect( result.current.end.toDateString() ).toBe( daysBefore( VISITS_OPTIONS.date, days ) );
		expect( result.current.start.toDateString() ).toBe(
			daysBefore( VISITS_OPTIONS.date, days * 2 - 1 )
		);
	} );

	it( 'remembers the period per user and reopens on the latest window', () => {
		const { result, unmount } = renderHook( () => useStatsPeriod() );
		act( () => result.current.setDays( 30 ) );
		act( () => result.current.goToPrevious() );
		unmount();

		expect( renderHook( () => useStatsPeriod() ).result.current ).toMatchObject( {
			days: 30,
			offset: 0,
		} );

		window.JP_CONNECTION_INITIAL_STATE.userConnectionData.currentUser.id = 2;
		expect( renderHook( () => useStatsPeriod() ).result.current.days ).toBe( 7 );
	} );
} );
