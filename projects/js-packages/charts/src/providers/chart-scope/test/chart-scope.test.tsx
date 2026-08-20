import { renderHook } from '@testing-library/react';
import { ChartScopeContext, useChartScopeElement } from '../index';
import type { ReactNode } from 'react';

describe( 'useChartScopeElement', () => {
	// The default has to stay null rather than `document.documentElement`: a chart with no scope above it must resolve nothing and fall back to its theme literal, not silently read the document root again.
	it( 'returns null with no scope above it', () => {
		const { result } = renderHook( () => useChartScopeElement() );

		expect( result.current ).toBeNull();
	} );

	it( 'returns the enclosing scope element', () => {
		const scope = document.createElement( 'div' );

		const { result } = renderHook( () => useChartScopeElement(), {
			wrapper: ( { children }: { children: ReactNode } ) => (
				<ChartScopeContext.Provider value={ scope }>{ children }</ChartScopeContext.Provider>
			),
		} );

		expect( result.current ).toBe( scope );
	} );
} );
