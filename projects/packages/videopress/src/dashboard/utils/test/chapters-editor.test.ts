import { resetFeatures, setFeatures } from '../../test-utils/features';
import { isChaptersEditorEnabled } from '../chapters-editor';

type Win = { JPVIDEOPRESS_INITIAL_STATE?: unknown };

const win = window as unknown as Win;

afterEach( () => {
	resetFeatures();
	delete win.JPVIDEOPRESS_INITIAL_STATE;
} );

describe( 'isChaptersEditorEnabled', () => {
	it( 'is false when the initial state global is absent', () => {
		delete win.JPVIDEOPRESS_INITIAL_STATE;

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	// A payload rendered by a PHP build predating the gate has no `features`
	// key at all; the reader must default off rather than throw.
	it( 'is false when the payload carries no feature gates', () => {
		win.JPVIDEOPRESS_INITIAL_STATE = { siteData: { id: 1 } };

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	it( 'is false when the gate is explicitly off', () => {
		setFeatures( { chaptersEditor: false } );

		expect( isChaptersEditorEnabled() ).toBe( false );
	} );

	it( 'is true when the gate is on', () => {
		setFeatures( { chaptersEditor: true } );

		expect( isChaptersEditorEnabled() ).toBe( true );
	} );
} );
