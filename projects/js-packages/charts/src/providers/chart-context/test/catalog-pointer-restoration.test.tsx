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
	it( 'restores an overridden mapped field to the catalog pointer in providerTheme, and carries the literal in the wrapper style', () => {
		const wrapper = createWrapper( { gridStyles: { stroke: 'red' } } );

		const { result } = renderHook( () => useGlobalChartsContext(), { wrapper } );

		expect( result.current.theme.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.current.theme.gridStyles.stroke ).not.toBe( 'red' );
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
