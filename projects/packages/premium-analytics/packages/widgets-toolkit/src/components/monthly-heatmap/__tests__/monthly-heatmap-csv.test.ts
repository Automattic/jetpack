/**
 * Internal dependencies
 */
import { monthlyHeatmapToCsv } from '../monthly-heatmap-csv';

describe( 'monthlyHeatmapToCsv', () => {
	it( 'puts the newest year first, whatever order the rows come in', () => {
		const { rows } = monthlyHeatmapToCsv( [
			{ year: 2024, months: [ 1 ], total: 1 },
			{ year: 2026, months: [ 3 ], total: 3 },
			{ year: 2025, months: [ 2 ], total: 2 },
		] );

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025, 2024 ] );
	} );
} );
