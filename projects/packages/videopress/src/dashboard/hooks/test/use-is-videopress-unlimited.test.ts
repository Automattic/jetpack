import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useIsVideoPressUnlimited } from '../use-is-videopress-unlimited';

type InitialState = { siteData?: { isVideoPressUnlimited?: boolean } };
const setInitialState = ( state: InitialState | undefined ) => {
	(
		window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState }
	 ).JPVIDEOPRESS_INITIAL_STATE = state;
};

const featuresResponse = ( isUnlimited: boolean ) => ( {
	isVideoPressSupported: true,
	isVideoPress1TBSupported: false,
	isVideoPressUnlimitedSupported: isUnlimited,
} );

describe( 'useIsVideoPressUnlimited', () => {
	afterEach( () => setInitialState( undefined ) );

	it( 'returns false when neither initial state nor the features flag indicate unlimited', async () => {
		setInitialState( { siteData: { isVideoPressUnlimited: false } } );
		mockApiFetch( async () => featuresResponse( false ) );

		const { result } = renderHook( () => useIsVideoPressUnlimited(), {
			wrapper: createTestWrapper(),
		} );

		// Give the features query a chance to resolve, then confirm still false.
		await waitFor( () => expect( result.current ).toBe( false ) );
		expect( result.current ).toBe( false );
	} );

	it( 'returns true synchronously from initial state', () => {
		setInitialState( { siteData: { isVideoPressUnlimited: true } } );
		mockApiFetch( async () => featuresResponse( false ) );

		const { result } = renderHook( () => useIsVideoPressUnlimited(), {
			wrapper: createTestWrapper(),
		} );

		// No waitFor: the initial-state signal is available on first render.
		expect( result.current ).toBe( true );
	} );

	it( 'returns true from the features REST flag when initial state is not unlimited', async () => {
		setInitialState( { siteData: { isVideoPressUnlimited: false } } );
		mockApiFetch( async () => featuresResponse( true ) );

		const { result } = renderHook( () => useIsVideoPressUnlimited(), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current ).toBe( true ) );
	} );
} );
