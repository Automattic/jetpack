/**
 * External dependencies
 */
import { useBarLegendItems } from '@jetpack-premium-analytics/externals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useLockedPrimaryLegendItems } from '../use-locked-primary-legend-items';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	useBarLegendItems: jest.fn(),
} ) );

const mockUseBarLegendItems = jest.mocked( useBarLegendItems );
const SERIES = [ { label: 'Views', data: [] } ] as unknown as SeriesData[];

describe( 'useLockedPrimaryLegendItems', () => {
	it( 'pins the first item and leaves the rest untouched', () => {
		mockUseBarLegendItems.mockReturnValue( [
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
		expect( mockUseBarLegendItems ).toHaveBeenCalledWith(
			SERIES,
			{ collapseGroups: true },
			'line'
		);
	} );

	it( 'moves the named primary item first and pins it', () => {
		mockUseBarLegendItems.mockReturnValue( [
			{ label: 'Views', color: '#111111', seriesLabels: [ 'Views' ] },
			{ label: 'Visitors', color: '#222222', seriesLabels: [ 'Visitors' ] },
		] );

		const { result } = renderHook( () =>
			useLockedPrimaryLegendItems( SERIES, {}, undefined, 'Visitors' )
		);

		expect( result.current ).toEqual( [
			{ label: 'Visitors', color: '#222222', seriesLabels: [ 'Visitors' ], interactive: false },
			{ label: 'Views', color: '#111111', seriesLabels: [ 'Views' ] },
		] );
	} );

	it( 'returns an empty legend as is', () => {
		mockUseBarLegendItems.mockReturnValue( [] );

		const { result } = renderHook( () => useLockedPrimaryLegendItems( SERIES, {} ) );

		expect( result.current ).toEqual( [] );
	} );
} );
