import { isAiSeoEnabled } from '../is-ai-seo-enabled';

const setSeoState = ( isEnabled: boolean ) => {
	window.Jetpack_Editor_Initial_State = {
		'ai-assistant': { 'is-seo-enabled': isEnabled },
	} as unknown as Window[ 'Jetpack_Editor_Initial_State' ];
};

describe( 'isAiSeoEnabled', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'is false when the SEO feature is effectively off', () => {
		setSeoState( false );

		expect( isAiSeoEnabled() ).toBe( false );
	} );

	it( 'is true when the SEO feature is on', () => {
		setSeoState( true );

		expect( isAiSeoEnabled() ).toBe( true );
	} );

	it( 'treats a missing state as enabled', () => {
		expect( isAiSeoEnabled() ).toBe( true );
	} );
} );
