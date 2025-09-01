import { renderHook } from '@testing-library/react';
import { ThemeProvider } from '../../theme';
import { defaultTheme, jetpackTheme, wooTheme } from '../../theme/themes';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useGlobalChartsTheme } from '../hooks/use-global-charts-theme';
import type { ChartTheme } from '../../../types';
import type { ReactNode } from 'react';

const createWrapper = ( {
	globalTheme,
	localTheme,
}: {
	globalTheme?: Partial< ChartTheme >;
	localTheme?: Partial< ChartTheme >;
} = {} ) => {
	return ( { children }: { children: ReactNode } ) => {
		let content = children;

		if ( localTheme ) {
			content = <ThemeProvider theme={ localTheme }>{ content }</ThemeProvider>;
		}

		if ( globalTheme ) {
			content = <GlobalChartsProvider theme={ globalTheme }>{ content }</GlobalChartsProvider>;
		}

		return <>{ content }</>;
	};
};

describe( 'useGlobalChartsTheme', () => {
	describe( 'without any providers', () => {
		it( 'should return default theme when no providers are present', () => {
			const { result } = renderHook( () => useGlobalChartsTheme() );

			expect( result.current ).toEqual( defaultTheme );
		} );
	} );

	describe( 'with GlobalChartsProvider only', () => {
		it( 'should merge global theme with default theme', () => {
			const globalTheme = { colors: [ '#FF0000', '#00FF00', '#0000FF' ] };
			const wrapper = createWrapper( { globalTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( {
				...defaultTheme,
				...globalTheme,
			} );
		} );

		it( 'should work with predefined themes like jetpackTheme', () => {
			const wrapper = createWrapper( { globalTheme: jetpackTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( {
				...defaultTheme,
				...jetpackTheme,
			} );
		} );

		it( 'should work with predefined themes like wooTheme', () => {
			const wrapper = createWrapper( { globalTheme: wooTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( {
				...defaultTheme,
				...wooTheme,
			} );
		} );
	} );

	describe( 'with ThemeProvider only', () => {
		it( 'should merge local theme with default theme', () => {
			const localTheme = { backgroundColor: '#F0F0F0' };
			const wrapper = createWrapper( { localTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( {
				...defaultTheme,
				...localTheme,
			} );
		} );
	} );

	describe( 'with both providers', () => {
		it( 'should allow local theme to override global theme properties', () => {
			const globalTheme = { colors: [ '#FF0000' ], backgroundColor: '#GLOBAL' };
			const localTheme = { colors: [ '#0000FF' ], backgroundColor: '#LOCAL' };
			const wrapper = createWrapper( { globalTheme, localTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			// mergeThemes(globalTheme, localTheme) gives localTheme precedence
			expect( result.current.colors ).toEqual( [ '#0000FF' ] ); // from local
			expect( result.current.backgroundColor ).toBe( '#LOCAL' ); // from local
		} );

		it( 'should handle complex theme overrides with deep merging', () => {
			const globalTheme = {
				colors: [ '#FF0000', '#00FF00' ],
				gridStyles: { stroke: '#GLOBAL', strokeWidth: 2 },
				backgroundColor: '#GLOBAL_BG',
			};
			const localTheme = {
				backgroundColor: '#LOCAL_BG',
				gridStyles: { stroke: '#LOCAL' }, // partial override
			};
			const wrapper = createWrapper( { globalTheme, localTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			// Local theme properties should override global ones
			expect( result.current.backgroundColor ).toBe( '#LOCAL_BG' );
			expect( result.current.colors ).toEqual( [ '#FF0000', '#00FF00' ] ); // from global (not overridden)
			expect( result.current.gridStyles ).toEqual( {
				stroke: '#LOCAL', // from local
				strokeWidth: 2, // from global (not overridden)
			} );
		} );
	} );

	describe( 'memoization', () => {
		it( 'should return the same object reference when themes do not change', () => {
			const globalTheme = { colors: [ '#FF0000' ] };
			const wrapper = createWrapper( { globalTheme } );

			const { result, rerender } = renderHook( () => useGlobalChartsTheme(), { wrapper } );
			const firstResult = result.current;

			rerender();
			const secondResult = result.current;

			expect( firstResult ).toBe( secondResult );
		} );

		it( 'should return a new object when global theme changes', () => {
			const TestWrapper = ( {
				theme,
				children,
			}: {
				theme: Partial< ChartTheme >;
				children: ReactNode;
			} ) => <GlobalChartsProvider theme={ theme }>{ children }</GlobalChartsProvider>;

			let theme = { colors: [ '#FF0000' ] };
			const { result, rerender } = renderHook( () => useGlobalChartsTheme(), {
				wrapper: ( { children } ) => <TestWrapper theme={ theme }>{ children }</TestWrapper>,
			} );
			const firstResult = result.current;

			// Change the theme prop
			theme = { colors: [ '#00FF00' ] };
			rerender();
			const secondResult = result.current;

			// The memoization should detect the theme change and return a new object
			expect( firstResult ).not.toBe( secondResult ); // Different object references
			expect( firstResult.colors ).toEqual( [ '#FF0000' ] );
			expect( secondResult.colors ).toEqual( [ '#00FF00' ] );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle empty global theme object', () => {
			const wrapper = createWrapper( { globalTheme: {} } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( defaultTheme );
		} );

		it( 'should handle empty local theme object', () => {
			const wrapper = createWrapper( { localTheme: {} } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( defaultTheme );
		} );

		it( 'should handle null/undefined theme values gracefully', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const globalTheme = { colors: undefined as any };
			const wrapper = createWrapper( { globalTheme } );

			const { result } = renderHook( () => useGlobalChartsTheme(), { wrapper } );

			expect( result.current ).toEqual( {
				...defaultTheme,
				colors: undefined,
			} );
		} );
	} );

	describe( 'context isolation', () => {
		it( 'should not throw when GlobalChartsContext is not available', () => {
			expect( () => {
				renderHook( () => useGlobalChartsTheme() );
			} ).not.toThrow();
		} );
	} );
} );
