import { renderHook } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useGlobalChartsTheme } from '../hooks/use-global-charts-theme';
import { defaultTheme } from '../themes';
import type { ChartTheme } from '../../../types';
import type { ReactNode } from 'react';

const createWrapper = ( theme?: Partial< ChartTheme > ) => {
	return ( { children }: { children: ReactNode } ) => (
		<GlobalChartsProvider theme={ theme }>{ children }</GlobalChartsProvider>
	);
};

describe( 'useGlobalChartsTheme', () => {
	describe( 'without any providers', () => {
		it( 'should return default theme when no providers are present', () => {
			const { result } = renderHook( () => useGlobalChartsTheme() );

			expect( result.current ).toEqual( defaultTheme );
		} );
	} );

	describe( 'with GlobalChartsProvider', () => {
		it( 'should return merged theme when provider has custom theme', () => {
			const wrapper = createWrapper( { tickLength: 9 } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current.tickLength ).toBe( 9 );
			// Everything the consumer did not set still comes from the default theme.
			expect( result.current.gridStyles ).toEqual( defaultTheme.gridStyles );
		} );

		it( 'should handle empty theme object', () => {
			const wrapper = createWrapper( {} );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( defaultTheme );
		} );
	} );

	describe( 'theme stability', () => {
		it( 'should return the same theme object when provider theme does not change', () => {
			const customTheme = { tickLength: 9 };
			const wrapper = createWrapper( customTheme );

			const { result, rerender } = renderHook( () => useGlobalChartsTheme(), { wrapper } );
			const firstResult = result.current;

			rerender();
			const secondResult = result.current;

			// The GlobalChartsProvider should memoize the theme
			expect( firstResult ).toBe( secondResult );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle null/undefined theme values gracefully', () => {
			const customTheme = { tickLength: undefined };
			const wrapper = createWrapper( customTheme as unknown as Partial< ChartTheme > );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current.gridStyles ).toEqual( defaultTheme.gridStyles );
		} );
	} );
} );
