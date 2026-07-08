import { isStudioEnabled } from '../studio';

type InitialState = { features?: { studio?: boolean } };

const setInitialState = ( state: InitialState ) => {
	(
		window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState }
	 ).JPVIDEOPRESS_INITIAL_STATE = state;
};

const clearInitialState = () => {
	delete ( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState } )
		.JPVIDEOPRESS_INITIAL_STATE;
};

describe( 'isStudioEnabled', () => {
	afterEach( clearInitialState );

	it( 'returns false when the initial-state global is absent', () => {
		expect( isStudioEnabled() ).toBe( false );
	} );

	it( 'returns false when the initial state has no features key', () => {
		setInitialState( {} );

		expect( isStudioEnabled() ).toBe( false );
	} );

	it( 'returns false when features.studio is false', () => {
		setInitialState( { features: { studio: false } } );

		expect( isStudioEnabled() ).toBe( false );
	} );

	it( 'returns true when features.studio is true', () => {
		setInitialState( { features: { studio: true } } );

		expect( isStudioEnabled() ).toBe( true );
	} );
} );
