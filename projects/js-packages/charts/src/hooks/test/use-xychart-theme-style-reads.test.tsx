import { renderHook } from '@testing-library/react';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { SeriesData } from '../../types';
import type { ReactNode } from 'react';

// The theme resolves five catalog roles — background, grid, axis, tick and axis label. Each `getComputedStyle` call can force the browser to flush pending style, and this memo re-runs only when the scope element attaches or a series color changes, so a dashboard mounting N charts pays the count below N times over.
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

	it( 'reads every role from one computed-style snapshot, not one per role', () => {
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

	// The memo key serializes the strokes rather than joining them, so a color containing a comma or a space survives the round-trip intact. `rgba(0, 0, 0, 0.5)` is the one that proves it: it holds both separators and comes back whole.
	//
	// The `var()` entry resolves to its fallback rather than passing through, which is the point of resolving the palette at all — visx paints these as SVG presentation attributes, where a `var()` resolves to nothing.
	it( 'keeps a stroke that contains separators intact', () => {
		const { result } = renderWithScope( [
			{ label: 'A', options: { stroke: 'rgba(0, 0, 0, 0.5)' }, data: [] },
			{ label: 'B', options: { stroke: 'var(--brand, #fff)' }, data: [] },
		] as unknown as SeriesData[] );

		expect( result.current.colors.slice( 0, 2 ) ).toEqual( [ 'rgba(0, 0, 0, 0.5)', '#fff' ] );
	} );

	// Four of the five palette slots carry no catalog default, so in jsdom they resolve to nothing. Passing those to visx unresolved would make them its default stroke for any series without an explicit one, painting nothing at all.
	it( 'drops palette entries that resolve to nothing', () => {
		const { result } = renderWithScope( [] );

		expect( result.current.colors ).not.toEqual(
			expect.arrayContaining( [ expect.stringContaining( 'var(' ) ] )
		);
		expect( result.current.colors.length ).toBeGreaterThan( 0 );
	} );
} );
