/**
 * External dependencies
 */
import { useChartLegendItems } from '@jetpack-premium-analytics/externals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useLockedPrimaryLegendItems } from '../use-locked-primary-legend-items';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	useChartLegendItems: jest.fn(),
} ) );

const mockUseChartLegendItems = jest.mocked( useChartLegendItems );
const SERIES = [ { label: 'Views', data: [] } ] as unknown as SeriesData[];

describe( 'useLockedPrimaryLegendItems', () => {
	it( 'pins the first item and leaves the rest untouched', () => {
		mockUseChartLegendItems.mockReturnValue( [
			{ label: 'Views', color: '#111111' },
			{ label: 'Visitors', color: '#222222' },
			{ label: 'Comparison period', color: '#111111', interactive: false },
		] );

		const { result } = renderHook( () =>
			useLockedPrimaryLegendItems( SERIES, { collapseGroups: true }, 'line' )
		);

		expect( result.current ).toEqual( [
			{ label: 'Views', color: '#111111', interactive: false },
			{ label: 'Visitors', color: '#222222' },
			{ label: 'Comparison period', color: '#111111', interactive: false },
		] );
		expect( mockUseChartLegendItems ).toHaveBeenCalledWith(
			SERIES,
			{ collapseGroups: true },
			'line'
		);
	} );

	it( 'returns an empty legend as is', () => {
		mockUseChartLegendItems.mockReturnValue( [] );

		const { result } = renderHook( () => useLockedPrimaryLegendItems( SERIES, {} ) );

		expect( result.current ).toEqual( [] );
	} );
} );
