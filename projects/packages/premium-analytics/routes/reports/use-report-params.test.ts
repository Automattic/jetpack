/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReportParams } from './use-report-params';

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

describe( 'useReportParams', () => {
	/*
	 * A report offers no comparison control and its header names no compared
	 * period, so a delta in the table would have no baseline the reader can see.
	 */
	it( 'drops the comparison the URL carries in', () => {
		const { result } = renderHook( () => useReportParams() );

		expect( result.current ).not.toHaveProperty( 'comp' );
		expect( result.current ).not.toHaveProperty( 'compare_from' );
		expect( result.current ).not.toHaveProperty( 'compare_to' );
		expect( result.current ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'keeps the window itself', () => {
		const { result } = renderHook( () => useReportParams() );

		expect( result.current ).toEqual(
			expect.objectContaining( {
				from: SEARCH.from,
				to: SEARCH.to,
				interval: SEARCH.interval,
			} )
		);
	} );
} );
