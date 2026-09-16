import { renderHook, act } from '@testing-library/react';
import { getErrorSets, useRecommendations } from './use-recommendations';

jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useCriticalCssState: () => [ { providers: mockProviders } ],
	useSetProviderErrorDismissedAction: () => ( { mutate: mockMutate } ),
} ) );
jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: mockReturn } ),
} ) );

const mockMutate = jest.fn();
const mockReturn = jest.fn();
let mockProviders: object[];

const httpError = {
	url: 'https://example.com/a',
	message: 'HTTP 500',
	type: 'HttpError',
	meta: {},
};
const timeout = {
	url: 'https://example.com/b',
	message: 'Timed out',
	type: 'LoadTimeoutError',
	meta: {},
};

describe( 'useRecommendations', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockProviders = [
			{ key: 'ok', label: 'Fine', status: 'success', errors: [] },
			{ key: 'posts', label: 'Posts', status: 'error', errors: [ httpError ] },
			{
				key: 'pages',
				label: 'Pages',
				status: 'error',
				errors: [ timeout ],
				dismissed_errors: [ 'LoadTimeoutError' ],
			},
		];
	} );

	it( 'splits failed providers into active and dismissed recommendations', () => {
		const { result } = renderHook( () => useRecommendations() );

		expect( result.current.activeRecommendations.map( r => r.key ) ).toEqual( [ 'posts' ] );
		expect( result.current.dismissedRecommendations.map( r => r.key ) ).toEqual( [ 'pages' ] );
		expect( mockReturn ).not.toHaveBeenCalled();
	} );

	it( 'returns to Settings when no provider has failed', () => {
		mockProviders = [ { key: 'ok', label: 'Fine', status: 'success', errors: [] } ];
		renderHook( () => useRecommendations() );

		expect( mockReturn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dismisses one recommendation and reveals all dismissed ones', () => {
		const { result } = renderHook( () => useRecommendations() );

		act( () => result.current.dismiss( result.current.activeRecommendations[ 0 ] ) );
		expect( mockMutate ).toHaveBeenLastCalledWith( [
			{ provider: 'posts', error_type: 'HttpError', dismissed: true },
		] );

		act( () => result.current.showDismissed() );
		expect( mockMutate ).toHaveBeenLastCalledWith( [
			{ provider: 'pages', error_type: 'LoadTimeoutError', dismissed: false },
		] );
	} );
} );

describe( 'getErrorSets', () => {
	it( 'groups a recommendation’s errors and tolerates a missing list', () => {
		const sets = getErrorSets( {
			key: 'posts',
			label: 'Posts',
			errorType: 'HttpError',
			errors: [ httpError, { ...httpError, url: 'https://example.com/c' } ],
		} );
		expect( sets ).toHaveLength( 1 );
		expect( sets[ 0 ].type ).toBe( 'HttpError' );
		expect( Object.keys( sets[ 0 ].byUrl ) ).toHaveLength( 2 );

		expect(
			getErrorSets( {
				key: 'x',
				label: 'X',
				errorType: 'HttpError',
				errors: undefined as unknown as [],
			} )
		).toEqual( [] );
	} );
} );
