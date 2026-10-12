/**
 * External dependencies
 */
import { useChartLegendItems } from '@jetpack-premium-analytics/externals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useComparativeLegend } from '../use-comparative-legend';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	useChartLegendItems: jest.fn( () => [] ),
} ) );

const SERIES = [ { label: 'Views', data: [] } ] as unknown as SeriesData[];

describe( 'useComparativeLegend', () => {
	it.each( [
		[ 'the applied comparison', 'Prev. 30 days', 'Views (Prev. 30 days)' ],
		[ 'a generic period without one', undefined, 'Views (Previous period)' ],
	] )( "names each metric's comparison item after %s", ( _case, comparisonLabel, expected ) => {
		const { result } = renderHook( () =>
			useComparativeLegend( SERIES, true, comparisonLabel, 'line' )
		);

		expect( result.current.config ).toMatchObject( { collapseGroups: true, interactive: true } );
		expect( result.current.config.comparisonItem( 'Views' ) ).toBe( expected );
	} );

	it( 'keeps the config across renders so the legend items stay memoised', () => {
		const { result, rerender } = renderHook( () =>
			useComparativeLegend( SERIES, false, 'Prev. 30 days' )
		);
		const first = result.current.config;

		rerender();

		expect( result.current.config ).toBe( first );
		expect( jest.mocked( useChartLegendItems ) ).toHaveBeenLastCalledWith(
			SERIES,
			first,
			undefined
		);
	} );
} );
