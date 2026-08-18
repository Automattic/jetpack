import { renderHook } from '@testing-library/react';
import { useXYChartTheme } from '../use-xychart-theme';
import type { SeriesData } from '../../types';

// The theme resolves five catalog roles — background, grid, axis, tick and axis label. Each `getComputedStyle` call can force the browser to flush pending style, and this memo re-runs whenever `data` changes identity, so a dashboard mounting N charts pays the count below N times over.
const STABLE_DATA: SeriesData[] = [];

describe( 'useXYChartTheme style reads', () => {
	let getComputedStyleSpy: jest.SpyInstance;

	beforeEach( () => {
		document.documentElement.style.setProperty( '--a8c-charts-color-grid', '#00ff00' );
		getComputedStyleSpy = jest.spyOn( window, 'getComputedStyle' );
	} );

	afterEach( () => {
		getComputedStyleSpy.mockRestore();
		document.documentElement.style.removeProperty( '--a8c-charts-color-grid' );
		document.documentElement.style.removeProperty( '--a8c-charts-color-background' );
		document.documentElement.style.removeProperty( '--a8c-charts-color-axis' );
	} );

	const renderTheme = ( data: SeriesData[] = STABLE_DATA ) =>
		renderHook( ( { series }: { series: SeriesData[] } ) => useXYChartTheme( series ), {
			initialProps: { series: data },
		} );

	it( 'reads every role from one computed-style snapshot, not one per role', () => {
		document.documentElement.style.setProperty( '--a8c-charts-color-background', '#111111' );
		document.documentElement.style.setProperty( '--a8c-charts-color-axis', '#222222' );

		const { result } = renderTheme();

		expect( getComputedStyleSpy ).toHaveBeenCalledTimes( 1 );
		expect( result.current.backgroundColor ).toBe( '#111111' );
		expect( result.current.gridStyles.stroke ).toBe( '#00ff00' );
		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBe( '#222222' );
	} );

	it( 'does not re-read styles when the hook re-renders with the same inputs', () => {
		const { rerender } = renderTheme();

		getComputedStyleSpy.mockClear();
		rerender( { series: STABLE_DATA } );

		expect( getComputedStyleSpy ).not.toHaveBeenCalled();
	} );

	// A caller passing an inline array literal — `<LineChart data={ [ … ] } />` — gives the memo a new identity on every render, so the theme rebuilds each time. That costs one style query now; before the roles shared a snapshot it cost five.
	it( 'rebuilds once per render when the caller passes a fresh data array', () => {
		const { rerender } = renderTheme( [] );

		getComputedStyleSpy.mockClear();
		rerender( { series: [] } );

		expect( getComputedStyleSpy ).toHaveBeenCalledTimes( 1 );
	} );
} );
