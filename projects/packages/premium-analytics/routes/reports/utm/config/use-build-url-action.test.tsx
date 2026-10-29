/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useBuildUrlAction } from './use-build-url-action';
import type { UtmReportRow } from '@jetpack-premium-analytics/widgets-toolkit';

const BASE_ROW: UtmReportRow = { id: 'row', label: 'Landing page', views: 1 };

describe( 'useBuildUrlAction', () => {
	it( 'is eligible only for rows with builder values', () => {
		const { result } = renderHook( () => useBuildUrlAction( jest.fn() ) );
		const isEligible = result.current.isEligible as ( item: UtmReportRow ) => boolean;

		expect( isEligible( { ...BASE_ROW, urlBuilder: { source: 'newsletter' } } ) ).toBe( true );
		expect( isEligible( BASE_ROW ) ).toBe( false );
	} );

	it( 'opens the builder with the row values', () => {
		const onOpen = jest.fn();
		const urlBuilder = { destination: 'https://example.com/', source: 'newsletter' };
		const { result } = renderHook( () => useBuildUrlAction( onOpen ) );

		const { callback } = result.current as {
			callback: ( items: UtmReportRow[], context: never ) => void;
		};
		callback( [ { ...BASE_ROW, urlBuilder } ], {} as never );

		expect( onOpen ).toHaveBeenCalledWith( urlBuilder );
	} );
} );
