/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useSeriesStyles } from '../use-series-styles';
import type { ComparativeLineChartSeries } from '../../components/chart-comparative-line/types';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	useGlobalChartsContext: jest.fn(),
} ) );

const mockUseGlobalChartsContext = jest.mocked( useGlobalChartsContext );

describe( 'useSeriesStyles', () => {
	it( 'maps each series to the stroke and line styles the theme resolves for it', () => {
		const getElementStyles = jest.fn( ( { index }: { index: number } ) => ( {
			color: [ '#111111', '#222222' ][ index ],
			lineStyles: { strokeDasharray: index === 1 ? '4 4' : undefined },
		} ) );
		mockUseGlobalChartsContext.mockReturnValue( { getElementStyles } as unknown as ReturnType<
			typeof useGlobalChartsContext
		> );

		const series = [
			{ label: 'Current', data: [] },
			{ label: 'Previous', data: [] },
		] as unknown as ComparativeLineChartSeries[];

		const { result } = renderHook( () => useSeriesStyles( series ) );

		expect( result.current ).toEqual( [
			{ stroke: '#111111', strokeDasharray: undefined },
			{ stroke: '#222222', strokeDasharray: '4 4' },
		] );
		// The theme provider is asked once per series, with its position.
		expect( getElementStyles ).toHaveBeenCalledTimes( 2 );
		expect( getElementStyles ).toHaveBeenNthCalledWith( 2, { data: series[ 1 ], index: 1 } );
	} );
} );
