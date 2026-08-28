import { renderHook } from '@testing-library/react';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { ReactNode } from 'react';

describe( 'useXYChartTheme', () => {
	it( 'resolves axis color against the scope element, not the document root', () => {
		document.documentElement.style.setProperty( '--a8c-charts-color-axis', '#ff0000' );

		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-axis', '#00ff00' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBe( '#00ff00' );

		document.documentElement.style.removeProperty( '--a8c-charts-color-axis' );
		document.body.removeChild( scope );
	} );

	// visx applies `gridStyles` as an inline style, which beats the rule in `chart-paint.scss`. A stroke that reaches `buildChartTheme` therefore takes the grid back off the CSS cascade silently — nothing throws, the color is simply frozen at whatever JS resolved. jsdom cannot compute `var()`, so the painted color itself is covered in Storybook; this only guards the handover.
	it( 'leaves the grid stroke to CSS rather than passing it to visx', () => {
		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-grid', '#00ff00' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.gridStyles.stroke ).toBeUndefined();

		document.body.removeChild( scope );
	} );
} );
