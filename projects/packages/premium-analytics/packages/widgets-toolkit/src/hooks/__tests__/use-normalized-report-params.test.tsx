/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useNormalizedReportParams } from '../use-normalized-report-params';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( { from: '2026-01-01', to: '2026-06-30', interval: 'week' } ),
} ) );

describe( 'useNormalizedReportParams', () => {
	it( 'reads a long range on days when the scope locks the longer buckets', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ReportScopeProvider
				dateLimits={ { lockedPresetIds: [], lockedIntervals: [ 'week', 'month', 'year' ] } }
			>
				{ children }
			</ReportScopeProvider>
		);

		const { result } = renderHook( () => useNormalizedReportParams(), { wrapper } );

		expect( result.current.interval ).toBe( 'day' );
	} );
} );
