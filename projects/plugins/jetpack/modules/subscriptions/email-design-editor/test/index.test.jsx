/**
 * Tests for the newsletter email design screen's entry point.
 *
 * The module mounts on import, so each case re-imports it in isolation after
 * arranging the page it expects to find.
 */

const mockRender = jest.fn();

jest.mock( '@wordpress/element', () => {
	const actualElement = jest.requireActual( '@wordpress/element' );

	return {
		...actualElement,
		createRoot: () => ( { render: mockRender } ),
	};
} );

const MockEmailEditor = () => null;

jest.mock( '@woocommerce/email-editor', () => ( {
	ExperimentalEmailEditor: MockEmailEditor,
} ) );

const ELEMENT_ID = 'jetpack-email-design-editor';

/**
 * A page configuration with everything the editor needs.
 *
 * `bundle` is in the shape the WordPress.com route returns, deliberately
 * without the two settings that side strips before returning it.
 *
 * @param {object} overrides - Values to replace, or `undefined` to drop a key.
 * @return {object} A `window.JetpackEmailDesignEditor` value.
 */
function pageData( overrides = {} ) {
	return {
		elementId: ELEMENT_ID,
		postId: 878,
		postType: 'wp_template',
		bundle: {
			editor_settings: { styles: [ { css: 'body{}' } ] },
			editor_theme: { version: 3, settings: { color: { palette: [] } } },
			template: { id: 'wpcom/newsletter' },
			personalization_tags: [],
		},
		editorSettings: {
			allowedIframeStyleHandles: [ 'wp-block-library' ],
			__unstableResolvedAssets: { styles: '' },
		},
		urls: { back: '/wp-admin/admin.php?page=x', listings: '/wp-admin/edit.php' },
		userEmail: 'creator@example.com',
		globalStylesPostId: 878,
		...overrides,
	};
}

/**
 * Import the entry point fresh, so its mount runs against the current page.
 *
 * @return {void}
 */
function loadEntryPoint() {
	jest.isolateModules( () => {
		require( '../src/index' );
	} );
}

/**
 * The props the entry point handed to the editor.
 *
 * @return {object} Props of the mounted editor element.
 */
function mountedEditorProps() {
	const [ tree ] = mockRender.mock.calls[ 0 ];

	// The entry mounts the editor inside StrictMode.
	return tree.props.children.props;
}

describe( 'Email design editor entry point', () => {
	beforeEach( () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;
		delete window.JetpackEmailDesignEditor;
		mockRender.mockClear();
	} );

	describe( 'when it should not mount', () => {
		it( 'returns when the page provides no configuration', () => {
			loadEntryPoint();

			expect( mockRender ).not.toHaveBeenCalled();
		} );

		it( 'returns when the container is missing', () => {
			document.body.innerHTML = '';
			window.JetpackEmailDesignEditor = pageData();

			loadEntryPoint();

			expect( mockRender ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'the configuration it builds', () => {
		it( 'mounts the editor on the post it was given', () => {
			window.JetpackEmailDesignEditor = pageData();

			loadEntryPoint();

			expect( mockRender ).toHaveBeenCalledTimes( 1 );

			const [ tree ] = mockRender.mock.calls[ 0 ];
			expect( tree.props.children.type ).toBe( MockEmailEditor );
			expect( mountedEditorProps().postId ).toBe( 878 );
			expect( mountedEditorProps().postType ).toBe( 'wp_template' );
		} );

		it( 'reads the keys the editor store actually reads', () => {
			window.JetpackEmailDesignEditor = pageData();

			loadEntryPoint();

			// The five keys `SET_EDITOR_CONFIG` reduces. Any of them undefined and the
			// editor boots without settings, theme or navigation, reporting nothing.
			const { config } = mountedEditorProps();

			expect( config.theme ).toEqual( {
				version: 3,
				settings: { color: { palette: [] } },
			} );
			expect( config.urls ).toEqual( {
				back: '/wp-admin/admin.php?page=x',
				listings: '/wp-admin/edit.php',
			} );
			expect( config.userEmail ).toBe( 'creator@example.com' );
			expect( config.globalStylesPostId ).toBe( 878 );
			expect( config.editorSettings ).toBeDefined();
		} );

		it( 'merges the site half of the settings over the WordPress.com half', () => {
			window.JetpackEmailDesignEditor = pageData();

			loadEntryPoint();

			// WordPress.com strips these two before returning the bundle, because they
			// describe the installation rather than the design. Losing them is what
			// leaves the site's own CSS in the canvas.
			expect( mountedEditorProps().config.editorSettings ).toEqual( {
				styles: [ { css: 'body{}' } ],
				allowedIframeStyleHandles: [ 'wp-block-library' ],
				__unstableResolvedAssets: { styles: '' },
			} );
		} );

		it( 'does not pass the bundle through in its own shape', () => {
			window.JetpackEmailDesignEditor = pageData();

			loadEntryPoint();

			// The bundle's keys are snake_case and the store reads camelCase, so passing
			// it through unmapped is silently empty rather than an error.
			const { config } = mountedEditorProps();

			expect( config ).not.toHaveProperty( 'editor_settings' );
			expect( config ).not.toHaveProperty( 'editor_theme' );
			expect( config ).not.toHaveProperty( 'bundle' );
			expect( config ).not.toHaveProperty( 'elementId' );
			expect( config ).not.toHaveProperty( 'postId' );
			expect( config ).not.toHaveProperty( 'postType' );
		} );

		it( 'defaults a missing global styles post id to null rather than undefined', () => {
			window.JetpackEmailDesignEditor = pageData( { globalStylesPostId: undefined } );

			loadEntryPoint();

			expect( mountedEditorProps().config.globalStylesPostId ).toBeNull();
		} );
	} );

	describe( 'when the page left something out', () => {
		it.each( [
			[ 'the bundle', { bundle: undefined } ],
			[ 'the bundle settings', { bundle: { editor_theme: { version: 3 } } } ],
			[ 'the bundle theme', { bundle: { editor_settings: {} } } ],
			[ 'the urls', { urls: undefined } ],
			[ 'a back url that is a string', { urls: { back: 1, listings: '/x' } } ],
			[ 'the listings url', { urls: { back: '/x' } } ],
			[ 'the post id', { postId: undefined } ],
			[ 'the post type', { postType: undefined } ],
		] )( 'throws rather than mounting a broken editor without %s', ( _label, overrides ) => {
			window.JetpackEmailDesignEditor = pageData( overrides );

			expect( loadEntryPoint ).toThrow();
			expect( mockRender ).not.toHaveBeenCalled();
		} );
	} );
} );
