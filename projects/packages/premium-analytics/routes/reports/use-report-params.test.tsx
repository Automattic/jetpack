/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/routing';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReportParams } from './use-report-params';
import type { ReactNode } from 'react';

const SEARCH = {
	from: '2026-06-01T00:00:00+00:00',
	to: '2026-06-30T23:59:59+00:00',
	interval: 'day',
	preset: 'custom',
	comp: '1',
	compare_from: '2026-05-02T00:00:00+00:00',
	compare_to: '2026-05-31T23:59:59+00:00',
	compare_preset: 'previous-period',
};

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => SEARCH,
} ) );

/**
 * The scope the report route declares, which is what makes the strip happen.
 *
 * @param props          - Wrapper props.
 * @param props.children - The hook under test.
 * @return The wrapped tree.
 */
function noComparison( { children }: { children: ReactNode } ) {
	return <ReportScopeProvider offersComparison={ false }>{ children }</ReportScopeProvider>;
}

describe( 'useReportParams', () => {
	/*
	 * A report offers no comparison control and its header names no compared
	 * period, so a delta in the table would have no baseline the reader can see.
	 */
	it( 'drops the comparison the URL carries in', () => {
		const { result } = renderHook( () => useReportParams(), { wrapper: noComparison } );

		expect( result.current ).not.toHaveProperty( 'comp' );
		expect( result.current ).not.toHaveProperty( 'compare_from' );
		expect( result.current ).not.toHaveProperty( 'compare_to' );
		expect( result.current ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'keeps the window itself', () => {
		const { result } = renderHook( () => useReportParams(), { wrapper: noComparison } );

		expect( result.current ).toEqual(
			expect.objectContaining( {
				from: SEARCH.from,
				to: SEARCH.to,
				interval: SEARCH.interval,
			} )
		);
	} );

	// Guards the hook against re-hardcoding the strip: the surface decides, so a
	// surface that offers a comparison must get one.
	it( 'keeps the comparison where the surface offers one', () => {
		const { result } = renderHook( () => useReportParams() );

		expect( result.current ).toMatchObject( {
			comp: '1',
			compare_from: SEARCH.compare_from,
		} );
	} );
} );
