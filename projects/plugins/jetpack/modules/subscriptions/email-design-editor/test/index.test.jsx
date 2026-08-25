/**
 * Tests for the newsletter email design screen's entry point.
 *
 * The module mounts on import, so each case re-imports it in isolation after
 * arranging the page and the bootstrap response it expects to find.
 */

const mockRender = jest.fn();
const mockApiFetch = jest.fn();

jest.mock( '@wordpress/element', () => {
	const actualElement = jest.requireActual( '@wordpress/element' );

	return {
		...actualElement,
		createRoot: () => ( { render: mockRender } ),
	};
} );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args ) => mockApiFetch( ...args ),
} ) );

const MockEmailEditor = () => null;

jest.mock( '@woocommerce/email-editor', () => ( {
	ExperimentalEmailEditor: MockEmailEditor,
} ) );

const ELEMENT_ID = 'jetpack-email-design-editor';

/**
 * The bootstrap response, in the shape the WordPress.com route returns it —
 * deliberately without the two settings that side strips before returning.
 *
 * @param {object} overrides - Values to replace, or `undefined` to drop a key.
 * @return {object} A bundle.
 */
function bootstrapBundle( overrides = {} ) {
	return {
		editor_settings: { styles: [ { css: 'body{}' } ] },
		editor_theme: { version: 3, settings: { color: { palette: [] } } },
		template: { id: 'pub/stylesheet//wpcom-newsletter' },
		personalization_tags: [],
		...overrides,
	};
}

/**
 * What the page localises: everything WordPress.com cannot know.
 *
 * @param {object} overrides - Values to replace, or `undefined` to drop a key.
 * @return {object} A `window.JetpackEmailDesignEditor` value.
 */
function pageData( overrides = {} ) {
	return {
		elementId: ELEMENT_ID,
		editorSettings: {
			allowedIframeStyleHandles: [ 'wp-block-library' ],
			__unstableResolvedAssets: { styles: '' },
		},
		urls: {
			back: '/wp-admin/admin.php?page=x',
			listings: '/wp-admin/edit.php',
			send: 'https://example.com/send',
		},
		userEmail: 'creator@example.com',
		globalStylesPostId: 878,
		...overrides,
	};
}

/**
 * Import the entry point fresh and let its mount settle.
 *
 * @return {Promise<void>} Resolves once the mount has rendered.
 */
async function loadEntryPoint() {
	jest.isolateModules( () => {
		require( '../src/index' );
	} );

	// The mount fetches before rendering, so let the microtask queue drain.
	await new Promise( resolve => setTimeout( resolve, 0 ) );
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

/**
 * Whether the entry rendered its error state rather than the editor.
 *
 * @return {boolean} True when the last render was not the editor.
 */
function renderedTheErrorState() {
	if ( ! mockRender.mock.calls.length ) {
		return false;
	}

	const [ tree ] = mockRender.mock.calls[ 0 ];

	return tree.type !== undefined && tree.props?.children?.type !== MockEmailEditor;
}

describe( 'Email design editor entry point', () => {
	beforeEach( () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;
		delete window.JetpackEmailDesignEditor;
		mockRender.mockClear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( bootstrapBundle() );
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		// eslint-disable-next-line no-console
		console.error.mockRestore();
	} );

	describe( 'when it should not mount at all', () => {
		it( 'returns without fetching when the page provides no configuration', async () => {
			await loadEntryPoint();

			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( mockRender ).not.toHaveBeenCalled();
		} );

		it( 'returns without fetching when the container is missing', async () => {
			document.body.innerHTML = '';
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( mockRender ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'fetching the bundle', () => {
		it( 'asks the local wpcom route, which every platform answers', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/email-editor-bootstrap',
			} );
		} );

		it( 'passes on a template slug when the page names one', async () => {
			window.JetpackEmailDesignEditor = pageData( { templateSlug: 'wpcom-digest' } );

			await loadEntryPoint();

			expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( 'template_slug=wpcom-digest' );
		} );

		it( 'takes the template id from the bundle rather than deriving one', async () => {
			// The id is namespaced by whichever theme served it, so a site computing it
			// locally is right on Simple and wrong on Atomic and self-hosted.
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( mountedEditorProps().postId ).toBe( 'pub/stylesheet//wpcom-newsletter' );
			expect( mountedEditorProps().postType ).toBe( 'wp_template' );
		} );

		it( 'shows an error instead of a blank screen when the fetch fails', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'network' ) );
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( mockRender ).toHaveBeenCalledTimes( 1 );
			expect( renderedTheErrorState() ).toBe( true );
		} );

		it( 'shows an error when the bundle carries no template id', async () => {
			mockApiFetch.mockResolvedValue( bootstrapBundle( { template: undefined } ) );
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( renderedTheErrorState() ).toBe( true );
		} );
	} );

	describe( 'the configuration it builds', () => {
		it( 'reads the keys the editor store actually reads', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// The five keys `SET_EDITOR_CONFIG` reduces. Any of them undefined and the
			// editor boots without settings, theme or navigation, reporting nothing.
			const { config } = mountedEditorProps();

			expect( config.theme ).toEqual( { version: 3, settings: { color: { palette: [] } } } );
			expect( config.urls ).toEqual( pageData().urls );
			expect( config.userEmail ).toBe( 'creator@example.com' );
			expect( config.globalStylesPostId ).toBe( 878 );
			expect( config.editorSettings ).toBeDefined();
		} );

		it( 'merges the site half of the settings over the WordPress.com half', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// WordPress.com strips these two before returning the bundle, because they
			// describe the installation rather than the design. Losing them is what
			// leaves the site's own CSS in the canvas.
			expect( mountedEditorProps().config.editorSettings ).toEqual( {
				styles: [ { css: 'body{}' } ],
				allowedIframeStyleHandles: [ 'wp-block-library' ],
				__unstableResolvedAssets: { styles: '' },
			} );
		} );

		it( 'does not pass the bundle through in its own shape', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// The bundle's keys are snake_case and the store reads camelCase, so passing
			// it through unmapped is silently empty rather than an error.
			const { config } = mountedEditorProps();

			expect( config ).not.toHaveProperty( 'editor_settings' );
			expect( config ).not.toHaveProperty( 'editor_theme' );
			expect( config ).not.toHaveProperty( 'template' );
			expect( config ).not.toHaveProperty( 'elementId' );
		} );

		it( 'defaults a missing global styles post id to null rather than undefined', async () => {
			window.JetpackEmailDesignEditor = pageData( { globalStylesPostId: undefined } );

			await loadEntryPoint();

			expect( mountedEditorProps().config.globalStylesPostId ).toBeNull();
		} );
	} );

	describe( 'the urls it will let the editor navigate to', () => {
		const { buildEditorConfig } = jest.requireActual( '../src/index' );

		// Each of these is assigned to `window.location.href` by a header button, so a
		// scheme the browser executes rather than navigates to is code running in
		// wp-admin with the administrator's session.
		it.each( [ [ 'back' ], [ 'listings' ], [ 'send' ] ] )(
			'rejects a javascript: url in %s',
			key => {
				const data = pageData( {
					urls: { ...pageData().urls, [ key ]: 'javascript:alert(1)' },
				} );

				expect( () => buildEditorConfig( bootstrapBundle(), data ) ).toThrow(
					/must be an http or https URL/
				);
			}
		);

		it( 'rejects a javascript: url disguised by leading whitespace', () => {
			// The URL parser strips this before reading the scheme, so a check against
			// the raw string would pass it through.
			const data = pageData( {
				urls: { ...pageData().urls, back: '  javascript:alert(1)' },
			} );

			expect( () => buildEditorConfig( bootstrapBundle(), data ) ).toThrow(
				/must be an http or https URL/
			);
		} );

		it( 'rejects a data: url', () => {
			const data = pageData( {
				urls: { ...pageData().urls, back: 'data:text/html,<script></script>' },
			} );

			expect( () => buildEditorConfig( bootstrapBundle(), data ) ).toThrow(
				/must be an http or https URL/
			);
		} );

		it( 'shows the error state rather than mounting when a url is rejected', async () => {
			window.JetpackEmailDesignEditor = pageData( {
				urls: { ...pageData().urls, back: 'javascript:alert(1)' },
			} );

			await loadEntryPoint();

			expect( renderedTheErrorState() ).toBe( true );
		} );
	} );

	describe( 'when a half left something out', () => {
		const { buildEditorConfig } = jest.requireActual( '../src/index' );

		it.each( [
			[ 'the bundle settings', bootstrapBundle( { editor_settings: undefined } ), pageData() ],
			[ 'the bundle theme', bootstrapBundle( { editor_theme: undefined } ), pageData() ],
			[ 'the urls', bootstrapBundle(), pageData( { urls: undefined } ) ],
			[ 'a listings url', bootstrapBundle(), pageData( { urls: { back: '/x' } } ) ],
		] )( 'throws rather than building a config without %s', ( _label, bundle, data ) => {
			expect( () => buildEditorConfig( bundle, data ) ).toThrow();
		} );
	} );
} );
