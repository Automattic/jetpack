/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useAttributesWithSearchFallback } from '../use-attributes-with-search-fallback';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
} ) );

const useSearchMock = jest.mocked( useSearch );

const COMPARED_WINDOW = {
	from: '2026-01-01T00:00:00.000Z',
	to: '2026-01-31T23:59:59.999Z',
	compare_from: '2025-12-01T00:00:00.000Z',
	compare_to: '2025-12-31T23:59:59.999Z',
	compare_preset: 'previous-period' as const,
	comp: '1' as const,
};

function noComparison( { children }: { children: ReactNode } ) {
	return <ReportScopeProvider offersComparison={ false }>{ children }</ReportScopeProvider>;
}

describe( 'useAttributesWithSearchFallback', () => {
	beforeEach( () => {
		useSearchMock.mockReturnValue( COMPARED_WINDOW );
	} );

	it( 'keeps the comparison when the surface offers one', () => {
		const { result } = renderHook( () => useAttributesWithSearchFallback( {} ) );

		expect( result.current.reportParams ).toMatchObject( { comp: '1' } );
	} );

	it( 'drops the comparison from the URL fallback when the surface offers none', () => {
		const { result } = renderHook( () => useAttributesWithSearchFallback( {} ), {
			wrapper: noComparison,
		} );

		expect( result.current.reportParams ).not.toHaveProperty( 'comp' );
		expect( result.current.reportParams ).not.toHaveProperty( 'compare_from' );
		expect( result.current.reportParams ).toMatchObject( { from: COMPARED_WINDOW.from } );
	} );

	it( 'drops the comparison the attributes carry when the surface offers none', () => {
		const { result } = renderHook(
			() => useAttributesWithSearchFallback( { reportParams: COMPARED_WINDOW } ),
			{ wrapper: noComparison }
		);

		expect( result.current.reportParams ).not.toHaveProperty( 'comp' );
		expect( result.current.reportParams ).toMatchObject( { from: COMPARED_WINDOW.from } );
	} );

	it( 'preserves other attributes and a stable result when its inputs do not change', () => {
		const attributes = { reportParams: COMPARED_WINDOW, max: 10 };
		const { result, rerender } = renderHook( () => useAttributesWithSearchFallback( attributes ), {
			wrapper: noComparison,
		} );
		const firstResult = result.current;

		rerender();

		expect( result.current.max ).toBe( 10 );
		expect( result.current ).toBe( firstResult );
	} );
} );
