const mockCoreStore = 'core-data-store';
const ID = 7;

// The derivations these cases turn on, taken from the shared fixture.
const WHITE_TEXT = '#262626';
const BLACK_TEXT = '#f2f2f2';
const BLUE_TEXT = '#e7ebfe';

let mockRecord;
let mockHasEdits;
let mockTheme;
let mockListener;
// An edit reaches the record and wakes the listeners, as core-data's own does, so the watcher is
// tested against the re-entry its write actually causes.
const mockEditEntityRecord = jest.fn( ( kind, name, id, edits ) => {
	mockRecord = { ...mockRecord, ...edits };
	mockHasEdits = true;
	mockListener();
} );
const mockUnsubscribe = jest.fn();

// Mocked rather than loaded: the real package resolves core's private APIs at module scope.
jest.mock( '@woocommerce/email-editor', () => ( { storeName: 'email-editor/editor' } ) );

jest.mock( '@wordpress/core-data', () => ( { store: 'core-data-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	subscribe: callback => {
		mockListener = callback;
		return mockUnsubscribe;
	},
	select: store =>
		store === mockCoreStore
			? {
					getEditedEntityRecord: () => mockRecord,
					hasEditsForEntityRecord: () => mockHasEdits,
				}
			: { getTheme: () => mockTheme },
	dispatch: () => ( { editEntityRecord: mockEditEntityRecord } ),
} ) );

const { watchDerivedTextColor } = require( '../src/derived-text-color' );

/**
 * Start a watcher, let it see the record as it stands, then hand back a way to change it.
 *
 * @param {object} initial   - The design record the screen opens on.
 * @param {object} inherited - The colors the site gives links and headings.
 * @return {Function} Replaces the record and runs the watcher, as a creator's pick would.
 */
function watching( initial, inherited = {} ) {
	mockRecord = initial;
	mockHasEdits = false;
	mockTheme = undefined;

	watchDerivedTextColor( ID, inherited );
	mockListener();

	return next => {
		mockRecord = next;
		mockHasEdits = true;
		mockListener();
	};
}

/**
 * The `styles` the watcher wrote, or undefined when it wrote nothing.
 *
 * @return {object|undefined} The written `styles`.
 */
function written() {
	const call = mockEditEntityRecord.mock.calls.at( -1 );

	return call?.[ 3 ]?.styles;
}

beforeEach( () => {
	jest.clearAllMocks();
	mockRecord = undefined;
	mockHasEdits = false;
	mockTheme = undefined;
	mockListener = undefined;
} );

describe( 'watchDerivedTextColor', () => {
	it( 'derives a text color for a background that had none', () => {
		const pick = watching( { styles: {} } );

		pick( { styles: { color: { background: '#ffffff' } } } );

		expect( written() ).toEqual( { color: { background: '#ffffff', text: WHITE_TEXT } } );
	} );

	it( 're-derives over the text color it derived for the previous background', () => {
		const pick = watching( { styles: { color: { background: '#ffffff', text: WHITE_TEXT } } } );

		pick( { styles: { color: { background: '#000000', text: WHITE_TEXT } } } );

		expect( written() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );
	} );

	it( 'leaves a text color the creator chose', () => {
		const pick = watching( { styles: { color: { background: '#ffffff', text: '#ff6600' } } } );

		pick( { styles: { color: { background: '#000000', text: '#ff6600' } } } );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	// Recognized by color rather than by spelling: what WordPress.com stored, or a creator typed,
	// need not be the lowercase hex this writes.
	it( 're-derives over its own derivation written another way', () => {
		const pick = watching( {
			styles: { color: { background: '#ffffff', text: 'RGB(38, 38, 38)' } },
		} );

		pick( { styles: { color: { background: '#000000', text: 'RGB(38, 38, 38)' } } } );

		expect( written() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );
	} );

	// A palette pick is a deliberate choice, so it stays even where it happens to be the color this
	// would have derived anyway.
	it( 'leaves a text color picked from the palette', () => {
		const pick = watching( {
			styles: { color: { background: '#ffffff', text: 'var:preset|color|ink' } },
		} );
		mockTheme = { settings: { color: { palette: [ { slug: 'ink', color: WHITE_TEXT } ] } } };

		pick( { styles: { color: { background: '#000000', text: 'var:preset|color|ink' } } } );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'clears a derived text color when the background is cleared', () => {
		const pick = watching( { styles: { color: { background: '#ffffff', text: WHITE_TEXT } } } );

		pick( { styles: { color: { text: WHITE_TEXT } } } );

		expect( written() ).toEqual( {} );
	} );

	it( 'keeps a chosen text color when the background is cleared', () => {
		const pick = watching( { styles: { color: { background: '#ffffff', text: '#ff6600' } } } );

		pick( { styles: { color: { text: '#ff6600' } } } );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'keeps the rest of the design when it clears the text color', () => {
		const pick = watching( {
			styles: { color: { background: '#ffffff', text: WHITE_TEXT, link: '#0000ff' } },
		} );

		pick( { styles: { color: { text: WHITE_TEXT, link: '#0000ff' } } } );

		expect( written() ).toEqual( { color: { link: '#0000ff' } } );
	} );

	it( 'resolves a palette pick before deriving', () => {
		const pick = watching( { styles: {} } );
		mockTheme = { settings: { color: { palette: [ { slug: 'brand', color: '#113af5' } ] } } };

		pick( { styles: { color: { background: 'var:preset|color|brand' } } } );

		expect( written() ).toEqual( {
			color: { background: 'var:preset|color|brand', text: BLUE_TEXT },
		} );
	} );

	it( 'resolves a palette pick written as a custom property', () => {
		const pick = watching( { styles: {} } );
		mockTheme = {
			settings: { color: { palette: { theme: [ { slug: 'brand', color: '#113af5' } ] } } },
		};

		pick( { styles: { color: { background: 'var(--wp--preset--color--brand)' } } } );

		expect( written()?.color?.text ).toBe( BLUE_TEXT );
	} );

	it( "prefers the creator's own palette over the theme's", () => {
		const pick = watching( { styles: {} } );
		mockTheme = {
			settings: { color: { palette: { theme: [ { slug: 'brand', color: '#ffffff' } ] } } },
		};

		pick( {
			settings: { color: { palette: { custom: [ { slug: 'brand', color: '#000000' } ] } } },
			styles: { color: { background: 'var:preset|color|brand' } },
		} );

		expect( written()?.color?.text ).toBe( BLACK_TEXT );
	} );

	it( 'derives nothing from a slug no palette defines', () => {
		const pick = watching( { styles: {} } );

		pick( { styles: { color: { background: 'var:preset|color|nowhere' } } } );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'derives nothing from a background it cannot read', () => {
		const pick = watching( { styles: {} } );

		pick( { styles: { color: { background: 'rgba(0, 0, 0, 0.5)' } } } );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'derives nothing before the record has loaded', () => {
		watchDerivedTextColor( ID );

		mockRecord = undefined;
		mockListener();

		mockRecord = { styles: { color: { background: '#ffffff' } } };
		mockHasEdits = false;
		mockListener();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	// A blog that inherits its design has a background nobody picked, and WordPress.com derives its
	// text color at render instead. Writing one here would turn that into an edit to save.
	it( 'derives nothing from a background that arrived with nothing pending', () => {
		watching( { styles: {} } );

		mockRecord = { styles: { color: { background: '#ffffff' } } };
		mockHasEdits = false;
		mockListener();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'still derives from the next pick after such a background arrives', () => {
		watching( { styles: {} } );

		mockRecord = { styles: { color: { background: '#ffffff' } } };
		mockHasEdits = false;
		mockListener();

		mockRecord = { styles: { color: { background: '#000000' } } };
		mockHasEdits = true;
		mockListener();

		expect( written() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );
	} );

	// The watcher is installed before the editor mounts, so its first sighting can already carry an
	// edit the package made while settling. That is still not a background the creator picked.
	it( 'derives nothing from the background the screen opened on', () => {
		mockRecord = { styles: { color: { background: '#000000' } } };
		mockHasEdits = true;

		watchDerivedTextColor( ID );
		mockListener();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'keeps its write out of the undo stack, and re-derives after an undo', () => {
		const pick = watching( { styles: { color: { background: '#ffffff', text: WHITE_TEXT } } } );

		pick( { styles: { color: { background: '#000000', text: WHITE_TEXT } } } );

		expect( mockEditEntityRecord ).toHaveBeenLastCalledWith(
			'root',
			'globalStyles',
			ID,
			{ styles: { color: { background: '#000000', text: BLACK_TEXT } } },
			{ undoIgnore: true }
		);

		pick( { styles: { color: { background: '#ffffff', text: BLACK_TEXT } } } );

		expect( written() ).toEqual( { color: { background: '#ffffff', text: WHITE_TEXT } } );
	} );

	it( 'writes once for one background change', () => {
		const pick = watching( { styles: {} } );

		pick( { styles: { color: { background: '#ffffff' } } } );
		mockRecord = { styles: { color: { background: '#ffffff', text: WHITE_TEXT } } };
		mockListener();

		expect( mockEditEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'derives the inherited link and heading colors alongside the text', () => {
		const pick = watching( { styles: {} }, { link: '#0073aa', heading: '#333333' } );

		pick( { styles: { color: { background: '#000000' } } } );

		expect( written() ).toEqual( {
			color: { background: '#000000', text: BLACK_TEXT },
			elements: {
				link: { color: { text: '#007cb8' } },
				heading: { color: { text: '#757575' } },
			},
		} );
	} );

	it( 'resolves a palette pick before deriving the element colors', () => {
		const pick = watching( { styles: {} }, { link: '#0073aa' } );
		mockTheme = { settings: { color: { palette: [ { slug: 'brand', color: '#000000' } ] } } };

		pick( { styles: { color: { background: 'var:preset|color|brand' } } } );

		expect( written().elements ).toEqual( { link: { color: { text: '#007cb8' } } } );
	} );

	it( 'derives the element colors even when the creator set the text color', () => {
		const pick = watching(
			{ styles: { color: { background: '#ffffff', text: '#ff00ff' } } },
			{ link: '#0073aa' }
		);

		pick( { styles: { color: { background: '#000000', text: '#ff00ff' } } } );

		expect( written() ).toEqual( {
			color: { background: '#000000', text: '#ff00ff' },
			elements: { link: { color: { text: '#007cb8' } } },
		} );
	} );

	it( 'writes the elements in one edit with the text color', () => {
		const pick = watching( { styles: {} }, { link: '#0073aa' } );

		pick( { styles: { color: { background: '#000000' } } } );

		expect( mockEditEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'derives nothing for elements when the bundle reported no inherited colors', () => {
		const pick = watching( { styles: {} } );

		pick( { styles: { color: { background: '#000000' } } } );

		expect( written().elements ).toBeUndefined();
	} );

	it( 'does nothing without a global-styles id', () => {
		expect( watchDerivedTextColor( null )() ).toBeUndefined();
		expect( mockListener ).toBeUndefined();
	} );

	it( 'stops watching when told to', () => {
		expect( watchDerivedTextColor( ID ) ).toBe( mockUnsubscribe );
	} );
} );
