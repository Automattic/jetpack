import { renderHook } from '@testing-library/react';
import { useLibrary } from '../use-library';
import { useOnboardingCounts } from '../use-onboarding-counts';
import type { View } from '@wordpress/dataviews';

jest.mock( '../use-library', () => ( {
	useLibrary: jest.fn(),
	LIBRARY_QUERY_KEY: 'library',
} ) );

// The hook issues one count query per library type; the mock answers each by
// the `type` filter on the view it receives.
const mockCounts = ( {
	videopress,
	local,
}: {
	videopress: { totalItems: number; isLoading: boolean };
	local: { totalItems: number; isLoading: boolean };
} ) => {
	( useLibrary as jest.Mock ).mockImplementation( ( view: View ) => {
		const type = view.filters?.[ 0 ]?.value;
		const { totalItems, isLoading } = type === 'videopress' ? videopress : local;

		return {
			items: [],
			isLoading,
			isError: false,
			paginationInfo: { totalItems, totalPages: 1 },
		};
	} );
};

describe( 'useOnboardingCounts', () => {
	it( 'reports both counts once both queries settle', () => {
		mockCounts( {
			videopress: { totalItems: 0, isLoading: false },
			local: { totalItems: 12, isLoading: false },
		} );

		const { result } = renderHook( () => useOnboardingCounts() );

		expect( result.current ).toEqual( {
			videoPressCount: 0,
			localCount: 12,
			isSettled: true,
		} );
	} );

	// One settled query is not enough: the modal both opens and picks its
	// footer label from these numbers, so a half-answer must read as unsettled.
	it( 'stays unsettled while either query is loading', () => {
		mockCounts( {
			videopress: { totalItems: 0, isLoading: false },
			local: { totalItems: 0, isLoading: true },
		} );

		const { result } = renderHook( () => useOnboardingCounts() );

		expect( result.current.isSettled ).toBe( false );
	} );

	it( 'queries the two distinct type filters', () => {
		mockCounts( {
			videopress: { totalItems: 1, isLoading: false },
			local: { totalItems: 2, isLoading: false },
		} );

		renderHook( () => useOnboardingCounts() );

		const requestedTypes = ( useLibrary as jest.Mock ).mock.calls.map(
			( [ view ] ) => view.filters[ 0 ].value
		);
		expect( requestedTypes ).toEqual( expect.arrayContaining( [ 'videopress', 'local' ] ) );
	} );
} );
