import { renderHook } from '@testing-library/react';
import { useIsVideoPressUnlimited } from '../use-is-videopress-unlimited';

type InitialState = { siteData?: { isVideoPressUnlimited?: boolean } };
const setInitialState = ( state: InitialState | undefined ) => {
	(
		window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState }
	 ).JPVIDEOPRESS_INITIAL_STATE = state;
};

describe( 'useIsVideoPressUnlimited', () => {
	afterEach( () => setInitialState( undefined ) );

	it( 'returns false when the boot payload does not indicate unlimited', () => {
		setInitialState( { siteData: { isVideoPressUnlimited: false } } );

		const { result } = renderHook( () => useIsVideoPressUnlimited() );

		expect( result.current ).toBe( false );
	} );

	it( 'returns true synchronously from the boot payload', () => {
		setInitialState( { siteData: { isVideoPressUnlimited: true } } );

		const { result } = renderHook( () => useIsVideoPressUnlimited() );

		expect( result.current ).toBe( true );
	} );

	it( 'returns false when the boot payload is absent (legacy page, tests)', () => {
		setInitialState( undefined );

		const { result } = renderHook( () => useIsVideoPressUnlimited() );

		expect( result.current ).toBe( false );
	} );
} );
