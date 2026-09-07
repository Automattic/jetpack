import { isChaptersEditorEnabled } from '..';

type Win = { videoPressEditorState?: Record< string, unknown > };

const win = window as unknown as Win;

/**
 * Seed the block editor's localized state with a chapters-editor gate value.
 *
 * @param enabled - The raw value as it would arrive from PHP.
 */
function setGate( enabled: unknown ): void {
	win.videoPressEditorState = { chaptersEditorEnabled: enabled };
}

afterEach( () => {
	delete win.videoPressEditorState;
} );

describe( 'isChaptersEditorEnabled', () => {
	it( 'is false when the localized state is absent', () => {
		delete win.videoPressEditorState;

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	it( 'is false when the gate key is missing from the payload', () => {
		win.videoPressEditorState = { siteType: 'jetpack' };

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	// `wp_localize_script()` casts scalars to strings, so a PHP `false` lands
	// as '' and a PHP `true` as '1' — the shape the neighboring
	// isVideoPressModuleActive flag already has.
	it( "is false for the stringified PHP false ('')", () => {
		setGate( '' );

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	it( "is true for the stringified PHP true ('1')", () => {
		setGate( '1' );

		expect( isChaptersEditorEnabled() ).toBe( true );
	} );

	// '0' is truthy in JS, so a plain Boolean() coercion would silently enable
	// the feature if PHP ever sent that instead of ''.
	it( "is false for the string '0'", () => {
		setGate( '0' );

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	it( 'accepts raw booleans, in case the payload moves to a JSON channel', () => {
		setGate( true );
		expect( isChaptersEditorEnabled() ).toBe( true );

		setGate( false );
		expect( isChaptersEditorEnabled() ).toBe( false );
	} );
} );
