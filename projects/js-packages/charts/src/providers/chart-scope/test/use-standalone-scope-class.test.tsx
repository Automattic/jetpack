import { renderHook } from '@testing-library/react';
import { CHART_SCOPE_CLASS } from '../../../styles/chart-scope-class';
import { GlobalChartsProvider } from '../../chart-context/global-charts-provider';
import { useStandaloneScopeClass } from '../use-standalone-scope-class';

describe( 'useStandaloneScopeClass', () => {
	it( 'returns the scope class with no provider above it', () => {
		const { result } = renderHook( () => useStandaloneScopeClass() );

		expect( result.current ).toBe( CHART_SCOPE_CLASS );
	} );

	it( 'returns undefined inside a GlobalChartsProvider', () => {
		const { result } = renderHook( () => useStandaloneScopeClass(), {
			wrapper: ( { children } ) => <GlobalChartsProvider>{ children }</GlobalChartsProvider>,
		} );

		expect( result.current ).toBeUndefined();
	} );
} );
