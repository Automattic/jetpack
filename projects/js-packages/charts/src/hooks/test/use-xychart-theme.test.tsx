import { renderHook } from '@testing-library/react';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { ReactNode } from 'react';

describe( 'useXYChartTheme', () => {
	it( 'resolves grid colour against the scope element, not the document root', () => {
		document.documentElement.style.setProperty( '--a8c-charts-color-grid', '#ff0000' );

		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-grid', '#00ff00' );
		document.body.appendChild( scope );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.gridStyles.stroke ).toBe( '#00ff00' );

		document.documentElement.style.removeProperty( '--a8c-charts-color-grid' );
		document.body.removeChild( scope );
	} );
} );
