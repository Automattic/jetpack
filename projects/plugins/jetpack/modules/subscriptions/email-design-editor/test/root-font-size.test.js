const mockCoreStore = 'core-data-store';

// WordPress.com's own stylesheet travels in the same array and sizes the caption cells from the
// property, so a watcher that matched on the property name anywhere would drop the email's CSS.
const WPCOM_STYLESHEET = {
	css: '.wp-block-image figcaption{font-size:var(--wpcom-email-root-font-size, 16px);}',
};

let mockSettings;
let mockTheme;
let mockDesign;
let mockListener;
const mockSetEditorSettings = jest.fn( settings => {
	mockSettings = settings;
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
			? {}
			: {
					getInitialEditorSettings: () => mockSettings,
					getTheme: () => mockTheme,
					getGlobalEmailStylesPost: () => mockDesign,
				},
	dispatch: () => ( { setEditorSettings: mockSetEditorSettings } ),
} ) );

const {
	bundleRootFontSize,
	rootFontSize,
	rootFontSizeCss,
	watchRootFontSize,
	withRootFontSize,
} = require( '../src/root-font-size' );

/**
 * A design layer carrying nothing but a root font size.
 *
 * @param {string} fontSize - The size.
 * @return {object} The layer.
 */
function sized( fontSize ) {
	return { styles: { typography: { fontSize } } };
}

/**
 * Start a watcher over a canvas built with a size, then hand back a way to change the design.
 *
 * @param {string|null} initial - The size the canvas was built with.
 * @return {Function} Replaces the creator's layer and runs the watcher, as a pick would.
 */
function watching( initial ) {
	mockSettings = { styles: [ WPCOM_STYLESHEET ], isFullScreenForced: true };
	mockTheme = initial ? sized( initial ) : {};
	mockDesign = undefined;

	watchRootFontSize( initial );
	mockListener();

	return next => {
		mockDesign = next;
		mockListener();
	};
}

/**
 * The canvas rules the watcher published, or undefined when it published nothing.
 *
 * @return {Array|undefined} The `styles` it dispatched.
 */
function published() {
	return mockSetEditorSettings.mock.calls.at( -1 )?.[ 0 ]?.styles;
}

beforeEach( () => {
	jest.clearAllMocks();
	mockSettings = undefined;
	mockTheme = undefined;
	mockDesign = undefined;
	mockListener = undefined;
} );

describe( 'rootFontSize', () => {
	it( 'takes the size the creator set over the one the site derives', () => {
		expect( rootFontSize( sized( '16px' ), sized( '22px' ) ) ).toBe( '22px' );
	} );

	it( 'falls back to the theme while the creator has set none', () => {
		expect( rootFontSize( sized( '16px' ), { styles: { color: {} } } ) ).toBe( '16px' );
	} );

	it.each( [
		[ 'neither layer sets one', {}, {} ],
		// theme.json takes a string; a number would reach the canvas as an invalid declaration.
		[ 'the stored size is not a string', sized( 16 ), {} ],
		[ 'the stored size is blank', sized( '   ' ), {} ],
	] )( 'reports none when %s', ( _label, theme, design ) => {
		expect( rootFontSize( theme, design ) ).toBeNull();
	} );
} );

describe( 'bundleRootFontSize', () => {
	it( 'reads the design the bundle carries over the theme it derived', () => {
		const bundle = {
			editor_theme: sized( '16px' ),
			global_styles: { record: sized( '22px' ) },
		};

		expect( bundleRootFontSize( bundle ) ).toBe( '22px' );
	} );

	it( 'reports none for a bundle carrying neither half', () => {
		expect( bundleRootFontSize( {} ) ).toBeNull();
	} );
} );

describe( 'rootFontSizeCss', () => {
	it( 'publishes a literal size', () => {
		expect( rootFontSizeCss( '22px' ) ).toBe(
			'.is-root-container{--wpcom-email-root-font-size:22px; }'
		);
	} );

	it.each( [
		[ 'the shorthand the panel writes', 'var:preset|font-size|large' ],
		// theme.json sanitizing rewrites the shorthand, so a saved design holds this form instead.
		[ 'the variable sanitizing rewrites it to', 'var(--wp--preset--font-size--large)' ],
	] )( 'publishes a preset pick stored as %s as the canvas variable', ( _label, stored ) => {
		expect( rootFontSizeCss( stored ) ).toBe(
			'.is-root-container{--wpcom-email-root-font-size:var(--wp--preset--font-size--large); }'
		);
	} );

	it.each( [
		// A size is the creator's own input, and this would close the rule and open another.
		[ 'closes the rule it sits in', '16px; } body { display: none; }' ],
		[ 'ends the declaration', '16px; color: red' ],
		[ 'is absent', undefined ],
	] )( 'publishes nothing for a value that %s', ( _label, stored ) => {
		expect( rootFontSizeCss( stored ) ).toBeNull();
	} );
} );

describe( 'withRootFontSize', () => {
	it( 'replaces an earlier size rather than stacking a second rule', () => {
		const once = withRootFontSize( [ WPCOM_STYLESHEET ], '16px' );
		const twice = withRootFontSize( once, '22px' );

		expect( twice ).toEqual( [
			WPCOM_STYLESHEET,
			{ css: '.is-root-container{--wpcom-email-root-font-size:22px; }' },
		] );
	} );

	it( 'keeps an entry that only reads the property, which is the email stylesheet', () => {
		expect( withRootFontSize( [ WPCOM_STYLESHEET ], '22px' ) ).toContainEqual( WPCOM_STYLESHEET );
	} );

	it( 'drops the rule when there is no size, so the fallback applies', () => {
		const once = withRootFontSize( [ WPCOM_STYLESHEET ], '16px' );

		expect( withRootFontSize( once, null ) ).toEqual( [ WPCOM_STYLESHEET ] );
	} );

	it( 'takes a settings object that carries no styles at all', () => {
		expect( withRootFontSize( undefined, '22px' ) ).toEqual( [
			{ css: '.is-root-container{--wpcom-email-root-font-size:22px; }' },
		] );
	} );
} );

describe( 'watchRootFontSize', () => {
	it( 'republishes the canvas rules on every change, stacking no second rule', () => {
		const pick = watching( '16px' );

		pick( sized( '22px' ) );
		pick( sized( '30px' ) );

		expect( mockSetEditorSettings ).toHaveBeenCalledTimes( 2 );
		expect( published() ).toEqual( [
			WPCOM_STYLESHEET,
			{ css: '.is-root-container{--wpcom-email-root-font-size:30px; }' },
		] );
	} );

	it( 'leaves the rest of the settings the package assembled alone', () => {
		const pick = watching( '16px' );

		pick( sized( '22px' ) );

		expect( mockSetEditorSettings.mock.calls.at( -1 )[ 0 ].isFullScreenForced ).toBe( true );
	} );

	it( 'publishes nothing while the design still resolves to the size the canvas was built with', () => {
		const pick = watching( '16px' );

		pick( sized( '16px' ) );

		expect( mockSetEditorSettings ).not.toHaveBeenCalled();
	} );

	it( 'clears the rule when the creator clears the size', () => {
		const pick = watching( '16px' );

		mockTheme = {};
		pick( { styles: {} } );

		expect( published() ).toEqual( [ WPCOM_STYLESHEET ] );
	} );

	it( 'waits for the design record to resolve rather than republishing the theme over it', () => {
		// The record resolves a tick after the editor mounts, and the canvas was built from the
		// copy the bundle carried, so reading the theme alone here would flash the wrong size.
		mockSettings = { styles: [ WPCOM_STYLESHEET ], isFullScreenForced: true };
		mockTheme = sized( '16px' );
		mockDesign = null;

		watchRootFontSize( '22px' );
		mockListener();

		expect( mockSetEditorSettings ).not.toHaveBeenCalled();
	} );

	it( 'waits for the editor to take the configuration rather than replacing it', () => {
		mockSettings = undefined;
		mockTheme = sized( '22px' );

		watchRootFontSize( null );
		mockListener();

		expect( mockSetEditorSettings ).not.toHaveBeenCalled();
	} );

	it( 'hands back a way to stop, for an editor that unmounts', () => {
		expect( watchRootFontSize( '16px' ) ).toBe( mockUnsubscribe );
	} );
} );
