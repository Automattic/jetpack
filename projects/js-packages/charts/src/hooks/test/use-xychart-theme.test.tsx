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

	// `chart-paint.scss` owns these four, and a color that reaches `buildChartTheme` takes them back off the CSS cascade silently: visx writes it as an inline style on the grid, which beats the stylesheet outright, and as a presentation attribute elsewhere, which freezes the color at whatever JS resolved. Nothing throws either way. jsdom cannot compute `var()`, so the painted colors themselves are covered in Storybook; this guards only the handover.
	it( 'leaves the CSS-painted colors out of the visx theme', () => {
		const scope = document.createElement( 'div' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.gridStyles.stroke ).toBeUndefined();
		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBeUndefined();
		expect( result.current.axisStyles.x.bottom.tickLine.stroke ).toBeUndefined();
		expect( result.current.axisStyles.x.bottom.tickLabel.fill ).toBeUndefined();

		document.body.removeChild( scope );
	} );
} );
