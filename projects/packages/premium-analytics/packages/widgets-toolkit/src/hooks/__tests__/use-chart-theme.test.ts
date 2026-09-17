/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../use-chart-theme';

describe( 'useChartTheme', () => {
	it( 'dashes a line by its comparison type, never by its series index', () => {
		const { result } = renderHook( () => useChartTheme() );
		const { seriesLineStyles, lineChart, legend } = result.current;

		expect( seriesLineStyles ).toHaveLength( 1 );
		expect( seriesLineStyles?.[ 0 ] ).not.toHaveProperty( 'strokeDasharray' );
		expect( legend?.shapeStyles?.[ 1 ] ).not.toHaveProperty( 'strokeDasharray' );
		expect( lineChart?.lineStyles?.comparison ).toHaveProperty( 'strokeDasharray' );
	} );
} );
