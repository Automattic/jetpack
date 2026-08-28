import { renderHook } from '@testing-library/react';
import { GlobalChartsProvider } from '../../providers/chart-context/global-charts-provider';
import { ChartScopeContext } from '../../providers/chart-scope';
import { useXYChartTheme } from '../use-xychart-theme';
import type { ReactNode } from 'react';

// A `theme` prop override reaches CSS-painted elements through the inline `--a8c-charts-*` var GlobalChartsProvider writes on its wrapper, and reaches the values our own components read through `providerTheme`. Before the fix, `providerTheme` carried the override's literal directly, so an element-level `--a8c-charts-color-background` override set inside the provider tree had no effect on the JS-resolved value — the two paths could disagree. After the fix, `providerTheme` carries the catalog pointer for an overridden role, so both paths resolve through the same CSS cascade and the nearer element wins.
describe( 'useXYChartTheme resolves a theme prop override through the CSS cascade', () => {
	it( "an element override set inside the provider tree beats the provider's theme prop literal", () => {
		const nestedOverride = document.createElement( 'div' );
		nestedOverride.style.setProperty( '--a8c-charts-color-background', '#00ff00' );
		document.body.appendChild( nestedOverride );

		const wrapper = ( { children }: { children: ReactNode } ) => (
			<GlobalChartsProvider theme={ { backgroundColor: 'rgb(255,0,0)' } }>
				<ChartScopeContext.Provider value={ nestedOverride }>
					{ children }
				</ChartScopeContext.Provider>
			</GlobalChartsProvider>
		);

		const { result } = renderHook( () => useXYChartTheme( [] ), { wrapper } );

		expect( result.current.backgroundColor ).toBe( '#00ff00' );

		document.body.removeChild( nestedOverride );
	} );
} );
