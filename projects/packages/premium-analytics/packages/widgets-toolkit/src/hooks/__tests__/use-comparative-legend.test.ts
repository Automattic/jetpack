/**
 * External dependencies
 */
import { useBarLegendItems } from '@jetpack-premium-analytics/externals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useComparativeLegend } from '../use-comparative-legend';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	useBarLegendItems: jest.fn( () => [] ),
} ) );

const SERIES = [ { label: 'Views', data: [] } ] as unknown as SeriesData[];

describe( 'useComparativeLegend', () => {
	it( "names each metric's comparison item after a generic period without a comparison", () => {
		const { result } = renderHook( () => useComparativeLegend( SERIES, true, undefined, 'line' ) );

		expect( result.current.config ).toMatchObject( { collapseGroups: true, interactive: true } );
		expect( result.current.config.comparisonSeriesItems( 'Views' ) ).toBe(
			'Views (Previous period)'
		);
		expect( jest.mocked( useBarLegendItems ) ).toHaveBeenLastCalledWith(
			SERIES,
			{ ...result.current.config, layout: undefined },
			'line'
		);
	} );
} );
