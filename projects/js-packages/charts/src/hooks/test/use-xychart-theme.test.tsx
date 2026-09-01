import { renderHook } from '@testing-library/react';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { ReactNode } from 'react';

describe( 'useXYChartTheme', () => {
	it( 'resolves background color against the scope element, not the document root', () => {
		document.documentElement.style.setProperty( '--a8c-charts-color-background', '#ff0000' );

		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-background', '#00ff00' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.backgroundColor ).toBe( '#00ff00' );

		document.documentElement.style.removeProperty( '--a8c-charts-color-background' );
		document.body.removeChild( scope );
	} );

	// Resolving a paint-only color here would freeze it: visx writes whatever it is handed onto the element, so a literal stops following the cascade and an override set below the provider wrapper never reaches it. Handing visx the pointer instead lets it resolve at the element it paints. jsdom does not compute `var()`, so what the pointer resolves *to* is covered in Storybook; this pins that the chain survives the theme build intact.
	it( 'hands visx the catalog pointer for paint-only colors rather than a resolved value', () => {
		const scope = document.createElement( 'div' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.gridStyles.stroke ).toBe( 'var(--a8c-charts-color-grid, #dbdbdb)' );
		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBe(
			'var(--a8c-charts-color-axis, #dbdbdb)'
		);
		expect( result.current.axisStyles.x.bottom.tickLine.stroke ).toBe(
			'var(--a8c-charts-color-tick, #dbdbdb)'
		);
		expect( result.current.axisStyles.x.bottom.tickLabel.fill ).toBe(
			'var(--a8c-charts-color-label-axis, #1e1e1e)'
		);

		document.body.removeChild( scope );
	} );

	// The one label color that has to arrive resolved: visx paints it on a portal container appended to `document.body`, where the catalog is not declared, and concatenates it into `box-shadow: 0 1px 2px ${color}55`, which a `var()` chain would invalidate.
	it( 'resolves the tooltip label color while the tick labels keep the pointer', () => {
		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-label-axis', '#0000ff' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.htmlLabel.color ).toBe( '#0000ff' );
		expect( result.current.svgLabelSmall.fill ).toBe(
			'var(--a8c-charts-color-label-axis, #1e1e1e)'
		);

		document.body.removeChild( scope );
	} );
} );
