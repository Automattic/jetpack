/**
 * Internal dependencies
 */
import { buildVisitsSeries } from '../build-visits-series';
import type { SanitizedStatsVisits } from '@jetpack-premium-analytics/data';

const report: SanitizedStatsVisits = {
	data: [
		{ period: '2026-06-09', date_start: '2026-06-09', views: 10, visitors: 4 },
		{ period: '2026-06-10', date_start: '2026-06-10', views: 25, visitors: 9 },
	],
	summary: { date_start: '2026-06-09', date_end: '2026-06-10' },
};

describe( 'buildVisitsSeries', () => {
	it( 'builds a Views and a Visitors series sharing the period axis', () => {
		const series = buildVisitsSeries( report );

		expect( series ).toHaveLength( 2 );
		expect( series.map( s => s.label ) ).toEqual( [ 'Views', 'Visitors' ] );
		expect( series.every( s => s.group === 'primary' ) ).toBe( true );
	} );

	it( 'maps each metric to its numeric values with Date x-points', () => {
		const [ views, visitors ] = buildVisitsSeries( report );

		expect( views.data.map( p => p.value ) ).toEqual( [ 10, 25 ] );
		expect( visitors.data.map( p => p.value ) ).toEqual( [ 4, 9 ] );
		expect( views.data.every( p => p.date instanceof Date ) ).toBe( true );
	} );

	it( 'returns no series when there is no data', () => {
		expect( buildVisitsSeries( undefined ) ).toEqual( [] );
		expect( buildVisitsSeries( { data: [], summary: { date_start: '', date_end: '' } } ) ).toEqual(
			[]
		);
	} );
} );
