import { renderHook } from '@testing-library/react';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
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

	// jsdom does not compute `var()`, so what a pointer resolves *to* is covered in Storybook.
	it( 'hands visx the catalog pointer for paint-only colors rather than a resolved value', () => {
		const scope = document.createElement( 'div' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.gridStyles.stroke ).toBe( 'var(--a8c-charts-color-grid, #dbdbdb)' );
		expect( result.current.axisStyles.x.bottom.axisLine.stroke ).toBe(
			'var(--a8c-charts-color-axis-x, #dbdbdb)'
		);
		expect( result.current.axisStyles.x.bottom.tickLine.stroke ).toBe(
			'var(--a8c-charts-color-tick-x, #dbdbdb)'
		);
		expect( result.current.axisStyles.x.bottom.tickLabel.fill ).toBe(
			'var(--a8c-charts-color-label-axis, #1e1e1e)'
		);

		document.body.removeChild( scope );
	} );

	it( 'hands visx the label pointer for the HTML label, even with an override in scope', () => {
		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-label-axis', '#0000ff' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.htmlLabel.color ).toBe( CATALOG_POINTERS.labelAxis );
		expect( result.current.svgLabelSmall.fill ).toBe(
			'var(--a8c-charts-color-label-axis, #1e1e1e)'
		);

		document.body.removeChild( scope );
	} );

	it( 'gives the y axis its own roles, resolving to none', () => {
		const { result } = renderHook( () => useXYChartTheme( [] ) );

		for ( const side of [ 'left', 'right' ] as const ) {
			expect( result.current.axisStyles.y[ side ].axisLine.stroke ).toBe(
				'var(--a8c-charts-color-axis-y, none)'
			);
			expect( result.current.axisStyles.y[ side ].tickLine.stroke ).toBe(
				'var(--a8c-charts-color-tick-y, none)'
			);
		}
	} );
} );
