import { renderHook } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import { defaultTheme } from '../themes';
import type { ChartTheme } from '../../../types';
import type { ReactNode } from 'react';

const createWrapper = ( theme?: Partial< ChartTheme > ) => {
	return ( { children }: { children: ReactNode } ) => (
		<GlobalChartsProvider theme={ theme }>{ children }</GlobalChartsProvider>
	);
};

describe( 'GlobalChartsProvider theme prop restores catalog pointers', () => {
	it( 'restores an overridden mapped field to the catalog pointer in providerTheme', () => {
		const wrapper = createWrapper( { gridStyles: { stroke: 'red' } } );

		const { result } = renderHook( () => useGlobalChartsContext(), { wrapper } );

		expect( result.current.theme.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.current.theme.gridStyles.stroke ).not.toBe( 'red' );
	} );

	// A value that reads its own role cannot be published — the role reads its theme layer, so it would close a cycle and blank the token. The field must still be restored to the catalog pointer, or CSS paints the catalog default while visx paints whatever the consumer's outer `var()` resolves to: the CSS/SVG divergence the catalog exists to remove.
	it( 'restores the catalog pointer for an override it cannot publish', () => {
		const wrapper = createWrapper( {
			gridStyles: { stroke: 'var(--brand, var(--a8c-charts-color-grid, red))' },
		} );

		const { result } = renderHook( () => useGlobalChartsContext(), { wrapper } );

		expect( result.current.theme.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
	} );

	it( 'keeps the literal for a non-mapped field override', () => {
		const wrapper = createWrapper( {
			leaderboardChart: { deltaColors: [ 'red', 'grey', 'green' ] },
		} );

		const { result } = renderHook( () => useGlobalChartsContext(), { wrapper } );

		expect( result.current.theme.leaderboardChart.deltaColors ).toEqual( [
			'red',
			'grey',
			'green',
		] );
	} );
} );
