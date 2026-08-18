import { renderHook } from '@testing-library/react';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { SeriesData } from '../../types';
import type { ReactNode } from 'react';

// The theme resolves five catalog roles — background, grid, axis, tick and axis label. Each `getComputedStyle` call can force the browser to flush pending style, and this memo re-runs only when the scope element attaches or a series colour changes, so a dashboard mounting N charts pays the count below N times over.
const STABLE_DATA: SeriesData[] = [];

describe( 'useXYChartTheme style reads', () => {
	let scope: HTMLElement;
	let getComputedStyleSpy: jest.SpyInstance;

	beforeEach( () => {
		scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-grid', '#00ff00' );
		document.body.appendChild( scope );
		getComputedStyleSpy = jest.spyOn( window, 'getComputedStyle' );
	} );

	afterEach( () => {
		getComputedStyleSpy.mockRestore();
		scope.remove();
	} );

	const renderWithScope = ( data: SeriesData[] = STABLE_DATA ) =>
		renderHook( ( { series }: { series: SeriesData[] } ) => useXYChartTheme( series ), {
			initialProps: { series: data },
			wrapper: ( { children }: { children: ReactNode } ) => (
				<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
			),
		} );

	it( 'takes one computed-style snapshot per theme build, not one per role', () => {
		const { result } = renderWithScope();

		expect( getComputedStyleSpy ).toHaveBeenCalledTimes( 1 );
		expect( result.current.gridStyles.stroke ).toBe( '#00ff00' );
	} );

	it( 'reads every role from that one snapshot', () => {
		scope.style.setProperty( '--a8c-charts-color-background', '#111111' );
		scope.style.setProperty( '--a8c-charts-color-axis', '#222222' );

		const { result } = renderWithScope();

		expect( getComputedStyleSpy ).toHaveBeenCalledTimes( 1 );
		expect( result.current.backgroundColor ).toBe( '#111111' );
		expect( result.current.gridStyles.stroke ).toBe( '#00ff00' );
		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBe( '#222222' );
	} );

	it( 'does not re-read styles when the hook re-renders with the same inputs', () => {
		const { rerender } = renderWithScope();

		getComputedStyleSpy.mockClear();
		rerender( { series: STABLE_DATA } );

		expect( getComputedStyleSpy ).not.toHaveBeenCalled();
	} );

	// A caller passing an inline array literal — `<LineChart data={ [ … ] } />` — hands the hook a new array identity on every render. The memo keys on the series strokes instead, so the theme is not rebuilt and no style is read. Keyed on `data` this cost one query per render, and before the roles shared a snapshot it cost five.
	it( 'does not rebuild when the caller passes a fresh data array of the same strokes', () => {
		const { rerender } = renderWithScope( [] );

		getComputedStyleSpy.mockClear();
		rerender( { series: [] } );

		expect( getComputedStyleSpy ).not.toHaveBeenCalled();
	} );

	it( 'rebuilds when a series stroke actually changes', () => {
		const withStroke = ( stroke: string ) =>
			[ { label: 'A', options: { stroke }, data: [] } ] as unknown as SeriesData[];
		const { result, rerender } = renderWithScope( withStroke( 'rgba(0, 0, 0, 0.5)' ) );

		getComputedStyleSpy.mockClear();
		rerender( { series: withStroke( 'rebeccapurple' ) } );

		expect( getComputedStyleSpy ).toHaveBeenCalledTimes( 1 );
		expect( result.current.colors[ 0 ] ).toBe( 'rebeccapurple' );
	} );

	// The memo key serialises the strokes rather than joining them, so a colour containing a comma or a space survives the round-trip intact.
	it( 'keeps a stroke that contains separators intact', () => {
		const { result } = renderWithScope( [
			{ label: 'A', options: { stroke: 'rgba(0, 0, 0, 0.5)' }, data: [] },
			{ label: 'B', options: { stroke: 'var(--brand, #fff)' }, data: [] },
		] as unknown as SeriesData[] );

		expect( result.current.colors.slice( 0, 2 ) ).toEqual( [
			'rgba(0, 0, 0, 0.5)',
			'var(--brand, #fff)',
		] );
	} );
} );
