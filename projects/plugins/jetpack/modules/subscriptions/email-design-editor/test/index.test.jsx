/**
 * Tests for the newsletter email design screen's entry point.
 *
 * The module mounts on import, so each case re-imports it in isolation after
 * arranging the page and the bootstrap response it expects to find.
 */

const mockRender = jest.fn();
const mockApiFetch = jest.fn();
const mockUse = jest.fn();
const mockCreatePreloadingMiddleware = jest.fn( map => ( { preloading: map } ) );

jest.mock( '@wordpress/element', () => {
	const actualElement = jest.requireActual( '@wordpress/element' );

	return {
		...actualElement,
		createRoot: () => ( { render: mockRender } ),
	};
} );

jest.mock( '@wordpress/api-fetch', () => {
	const apiFetch = ( ...args ) => mockApiFetch( ...args );

	apiFetch.use = ( ...args ) => mockUse( ...args );
	apiFetch.createPreloadingMiddleware = ( ...args ) => mockCreatePreloadingMiddleware( ...args );

	return { __esModule: true, default: apiFetch };
} );

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
		global_styles: {
			post_id: 999999999,
			can_edit: false,
			record: {
				id: 999999999,
				title: { rendered: 'Email styles' },
				settings: {},
				styles: { color: { background: '#00ff00' } },
			},
		},
		// The same templates as full REST records, which is what the editor's core-data
		// resolution needs and what the four-field `template` above cannot stand in for.
		templates: [
			{
				id: 'pub/stylesheet//wpcom-newsletter',
				slug: 'wpcom-newsletter',
				title: { rendered: 'Newsletter' },
				content: { raw: '' },
				post_types: [ 'wp_template' ],
				source: 'theme',
				origin: 'theme',
				has_theme_file: true,
				type: 'wp_template',
				status: 'publish',
			},
		],
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
		mockUse.mockClear();
		mockCreatePreloadingMiddleware.mockClear();
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
			expect( config.globalStylesPostId ).toBe( 999999999 );
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

		it( 'takes the global styles post id from the bundle, not the page', async () => {
			// A WordPress.com post id. A page working it out locally is right on Simple and
			// wrong on Atomic and self-hosted, exactly as for the template's id.
			window.JetpackEmailDesignEditor = pageData( { globalStylesPostId: 878 } );

			await loadEntryPoint();

			expect( mountedEditorProps().config.globalStylesPostId ).toBe( 999999999 );
		} );

		it( 'falls back to the page when the bundle carries no global styles post id', async () => {
			// Degrades to the previous behaviour against a bundle deployed before NL-871.
			mockApiFetch.mockResolvedValue( bootstrapBundle( { global_styles: undefined } ) );
			window.JetpackEmailDesignEditor = pageData( { globalStylesPostId: 878 } );

			await loadEntryPoint();

			expect( mountedEditorProps().config.globalStylesPostId ).toBe( 878 );
		} );

		it( 'defaults a missing global styles post id to null rather than undefined', async () => {
			mockApiFetch.mockResolvedValue( bootstrapBundle( { global_styles: undefined } ) );
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

	describe( 'preloading the templates the editor resolves', () => {
		const { buildPreloadMap } = jest.requireActual( '../src/index' );
		const templateId = 'pub/stylesheet//wpcom-newsletter';

		/**
		 * The map handed to `createPreloadingMiddleware` on the last mount.
		 *
		 * @return {object} The preload map.
		 */
		function preloadedMap() {
			return mockCreatePreloadingMiddleware.mock.calls[ 0 ][ 0 ];
		}

		it( 'preloads the collection under every context it has been seen asked for', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			const map = preloadedMap();

			// Including no context at all: this editor asks for `?context=edit` on WordPress
			// 7.1, the same load on WordPress.com asks for none, and a miss leaves the editor
			// waiting on a record that never arrives.
			expect( map[ '/wp/v2/templates' ].body ).toHaveLength( 1 );
			expect( map[ '/wp/v2/templates?context=edit' ].body ).toHaveLength( 1 );
			expect( map[ '/wp/v2/templates?context=view' ].body ).toHaveLength( 1 );
		} );

		it( 'preloads the item under the id the bundle gave, not one it derived', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( preloadedMap() ).toHaveProperty( `/wp/v2/templates/${ templateId }?context=edit` );
		} );

		it( 'passes the records through untouched, since the editor reads fields we cannot invent', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// `post_types` is read without optional chaining in the package's selectors, so a
			// record missing it throws rather than degrading.
			const [ record ] = preloadedMap()[ '/wp/v2/templates?context=edit' ].body;

			expect( record.post_types ).toEqual( [ 'wp_template' ] );
			expect( record.source ).toBe( 'theme' );
			expect( record.has_theme_file ).toBe( true );
		} );

		it( 'gives every entry headers, which parse:false callers read unconditionally', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			const { OPTIONS = {}, ...paths } = preloadedMap();

			// `OPTIONS` is the format's own container for OPTIONS responses rather than a path,
			// so its entries are one level down.
			[ ...Object.values( paths ), ...Object.values( OPTIONS ) ].forEach( entry => {
				expect( entry.headers ).toBeDefined();
			} );
		} );

		it( 'installs the middleware before the editor mounts', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// core-data resolves the template on the editor's first render, so a middleware
			// installed afterwards would be too late to answer for it.
			expect( mockUse.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
				mockRender.mock.invocationCallOrder[ 0 ]
			);
		} );

		it( 'preloads the global styles record under every context', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			const map = preloadedMap();
			const base = '/wp/v2/global-styles/999999999';

			// The record's contents are what paint the canvas, not just its id — measured on
			// WordPress.com, where a preloaded record's colour won over the stored design.
			[ base, `${ base }?context=view`, `${ base }?context=edit` ].forEach( path => {
				expect( map[ path ].body.styles.color.background ).toBe( '#00ff00' );
			} );
		} );

		it( 'answers the canUser probe, without which the canvas renders unstyled', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// The package guards on `postId && undefined !== canEdit`, and canEdit comes from an
			// OPTIONS request. Preload only the GET and it stays undefined, the selector returns
			// null, and the result is indistinguishable from the id never arriving.
			expect( preloadedMap().OPTIONS[ '/wp/v2/global-styles/999999999' ].headers.Allow ).toBe(
				'GET'
			);
		} );

		it( 'allows writes only when the bundle says the user may edit', async () => {
			mockApiFetch.mockResolvedValue(
				bootstrapBundle( {
					global_styles: {
						...bootstrapBundle().global_styles,
						can_edit: true,
					},
				} )
			);
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( preloadedMap().OPTIONS[ '/wp/v2/global-styles/999999999' ].headers.Allow ).toBe(
				'GET, POST, PUT'
			);
		} );

		it( 'never keys a global styles record other than its own', async () => {
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// The editor also loads the site's own record — measured as global-styles/2. Anything
			// broader than an exact id would push the site's own design through this plumbing.
			const map = preloadedMap();
			const keyed = [ ...Object.keys( map ), ...Object.keys( map.OPTIONS || {} ) ].filter( k =>
				k.includes( 'global-styles' )
			);

			expect( keyed.every( k => k.startsWith( '/wp/v2/global-styles/999999999' ) ) ).toBe( true );
			expect( keyed ).not.toContain( '/wp/v2/global-styles/2' );
		} );

		it.each( [
			[ 'a query string smuggled into the id', '2?context=edit' ],
			[ 'a numeric string', '999999999' ],
			[ 'zero', 0 ],
			[ 'a float', 1.5 ],
		] )( 'preloads no global styles path for %s', async ( _label, postId ) => {
			mockApiFetch.mockResolvedValue(
				bootstrapBundle( {
					global_styles: { ...bootstrapBundle().global_styles, post_id: postId },
				} )
			);
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// The keys are interpolated from this value, and the editor loads the site's own
			// global-styles record alongside ours. An id carrying a query string or a slash would
			// widen what we answer for — `2?context=edit` is the site's own record's path.
			const map = preloadedMap();

			expect( Object.keys( map ).some( k => k.includes( 'global-styles' ) ) ).toBe( false );
			expect( Object.keys( map.OPTIONS || {} ) ).toHaveLength( 0 );
		} );

		it.each( [
			[ 'a query string smuggled into the id', '2?context=edit' ],
			[ 'a numeric string', '999999999' ],
			[ 'zero', 0 ],
			[ 'a negative id', -1 ],
			[ 'a float', 1.5 ],
		] )( 'falls back to the page id rather than passing on %s', async ( _label, postId ) => {
			// `??` only falls through on null/undefined, so an invalid id that is merely falsy —
			// 0 — would otherwise reach the editor instead of the fallback.
			mockApiFetch.mockResolvedValue(
				bootstrapBundle( {
					global_styles: { ...bootstrapBundle().global_styles, post_id: postId },
				} )
			);
			window.JetpackEmailDesignEditor = pageData( { globalStylesPostId: 878 } );

			await loadEntryPoint();

			expect( mountedEditorProps().config.globalStylesPostId ).toBe( 878 );
		} );

		it( 'preloads the template half even when the bundle carries no global styles', async () => {
			mockApiFetch.mockResolvedValue( bootstrapBundle( { global_styles: undefined } ) );
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( preloadedMap() ).toHaveProperty( '/wp/v2/templates' );
			expect( preloadedMap().OPTIONS ).toBeUndefined();
		} );

		it( 'preloads the global styles half even when the bundle carries no templates', async () => {
			mockApiFetch.mockResolvedValue( bootstrapBundle( { templates: undefined } ) );
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			expect( preloadedMap() ).toHaveProperty( '/wp/v2/global-styles/999999999' );
			expect( preloadedMap() ).not.toHaveProperty( '/wp/v2/templates' );
		} );

		it( 'preloads nothing when the bundle carries neither half', async () => {
			mockApiFetch.mockResolvedValue(
				bootstrapBundle( { templates: undefined, global_styles: undefined } )
			);
			window.JetpackEmailDesignEditor = pageData();

			await loadEntryPoint();

			// WordPress.com does not send these yet. The editor must still mount rather than
			// the entry throwing on a key that is not there.
			expect( mockCreatePreloadingMiddleware ).not.toHaveBeenCalled();
			expect( renderedTheErrorState() ).toBe( false );

			// The save middleware still installs: the page named a record even though the
			// bundle carried none, and a write to it is still ours to catch.
			expect( mockUse ).toHaveBeenCalledTimes( 1 );
		} );

		describe( 'the Allow header the preloaded responses carry', () => {
			const id = 999999999;

			/**
			 * core-data derives a record's permissions from the `GET` response as well as the
			 * `OPTIONS` one, and reads a missing header as "nothing is permitted". The `GET`s
			 * resolve last, so dropping the header there hides the Styles panel outright.
			 *
			 * @param {boolean} canEdit - What WordPress.com reported for the record.
			 * @return {object} The preload map.
			 */
			function mapFor( canEdit ) {
				const bundle = bootstrapBundle( {
					global_styles: {
						post_id: id,
						can_edit: canEdit,
						record: { id, styles: {} },
					},
				} );

				return buildPreloadMap( bundle, templateId );
			}

			it( 'grants writes on every entry for the record when it is editable', () => {
				const map = mapFor( true );

				expect( map[ `/wp/v2/global-styles/${ id }` ].headers.Allow ).toBe( 'GET, POST, PUT' );
				expect( map[ `/wp/v2/global-styles/${ id }?context=edit` ].headers.Allow ).toBe(
					'GET, POST, PUT'
				);
				expect( map[ `/wp/v2/global-styles/${ id }?context=view` ].headers.Allow ).toBe(
					'GET, POST, PUT'
				);
				expect( map.OPTIONS[ `/wp/v2/global-styles/${ id }` ].headers.Allow ).toBe(
					'GET, POST, PUT'
				);
			} );

			it( 'grants only reads on every entry when it is not editable', () => {
				const map = mapFor( false );

				expect( map[ `/wp/v2/global-styles/${ id }` ].headers.Allow ).toBe( 'GET' );
				expect( map[ `/wp/v2/global-styles/${ id }?context=edit` ].headers.Allow ).toBe( 'GET' );
				expect( map.OPTIONS[ `/wp/v2/global-styles/${ id }` ].headers.Allow ).toBe( 'GET' );
			} );

			it( 'says the template is read-only rather than saying nothing', () => {
				const map = buildPreloadMap( bootstrapBundle(), templateId );

				expect( map[ `/wp/v2/templates/${ templateId }` ].headers.Allow ).toBe( 'GET' );
			} );
		} );

		it( 'installs nothing when the bundle sends an empty collection', () => {
			const empty = bootstrapBundle( { templates: [], global_styles: undefined } );

			expect( buildPreloadMap( empty, templateId ) ).toBeNull();
		} );

		it( 'omits the item entry when no record matches the template id', () => {
			const map = buildPreloadMap( bootstrapBundle(), 'pub/other//something-else' );

			expect( Object.keys( map ).filter( k => k.startsWith( '/wp/v2/templates' ) ) ).toEqual( [
				'/wp/v2/templates',
				'/wp/v2/templates?context=edit',
				'/wp/v2/templates?context=view',
			] );
		} );
	} );

	describe( 'when the Styles panel saves', () => {
		const { createDesignSaveMiddleware } = jest.requireActual( '../src/index' );
		const ourId = 999999999;

		it( 'sends the design to WordPress.com rather than to the site', async () => {
			const next = jest.fn();
			// The shape WordPress.com actually answers with: a read-back wrapped in an envelope.
			mockApiFetch.mockResolvedValueOnce( {
				blog_id: 12345,
				design: { styles: { color: { background: '#c0ffee' } }, settings: {} },
				discarded: false,
			} );

			const result = await createDesignSaveMiddleware( ourId )(
				{
					path: `/wp/v2/global-styles/${ ourId }`,
					method: 'PUT',
					data: { styles: { color: { background: '#c0ffee' } } },
				},
				next
			);

			expect( next ).not.toHaveBeenCalled();
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/email-editor-bootstrap',
				method: 'POST',
				data: { design: { styles: { color: { background: '#c0ffee' } } } },
			} );

			// core-data takes this as the record itself, and the canvas is drawn from its `styles`
			// and `settings`. Handing back the envelope leaves both undefined and the canvas snaps
			// to its pre-edit design.
			expect( result ).toEqual( {
				id: ourId,
				settings: {},
				styles: { color: { background: '#c0ffee' } },
			} );
		} );

		it( 'hands back what was stored, not what was sent', async () => {
			// Sanitizing drops anything outside the theme.json schema, so the read-back can differ
			// from the submission. The panel has to show what survived.
			mockApiFetch.mockResolvedValueOnce( {
				blog_id: 12345,
				design: { styles: { color: { background: '#ffffff' } }, settings: {} },
				discarded: false,
			} );

			const result = await createDesignSaveMiddleware( ourId )(
				{
					path: `/wp/v2/global-styles/${ ourId }`,
					method: 'PUT',
					data: { styles: { color: { background: 'color-mix(in srgb, #fff 50%, #000)' } } },
				},
				jest.fn()
			);

			expect( result.styles ).toEqual( { color: { background: '#ffffff' } } );
		} );

		it( 'survives an envelope carrying no design', async () => {
			mockApiFetch.mockResolvedValueOnce( { blog_id: 12345, design: null, discarded: true } );

			const result = await createDesignSaveMiddleware( ourId )(
				{ path: `/wp/v2/global-styles/${ ourId }`, method: 'PUT', data: {} },
				jest.fn()
			);

			expect( result ).toEqual( { id: ourId, settings: {}, styles: {} } );
		} );

		it.each( [ 'POST', 'PUT', 'PATCH' ] )( 'catches a %s', async method => {
			mockApiFetch.mockResolvedValueOnce( {} );

			await createDesignSaveMiddleware( ourId )(
				{ path: `/wp/v2/global-styles/${ ourId }`, method, data: {} },
				jest.fn()
			);

			expect( mockApiFetch ).toHaveBeenCalled();
		} );

		it( "leaves a write to the site's own record alone", async () => {
			const next = jest.fn( () => 'went to the network' );

			const result = await createDesignSaveMiddleware( ourId )(
				{ path: '/wp/v2/global-styles/59', method: 'PUT', data: { styles: {} } },
				next
			);

			// The regression this middleware exists to avoid: the site's design must never be
			// routed through the email endpoint, which would look correct on Simple while doing it.
			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( next ).toHaveBeenCalled();
			expect( result ).toBe( 'went to the network' );
		} );

		it( 'leaves reads of our own record alone', async () => {
			const next = jest.fn( () => 'went to the preload' );

			const result = await createDesignSaveMiddleware( ourId )(
				{ path: `/wp/v2/global-styles/${ ourId }?context=edit`, method: 'GET' },
				next
			);

			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( result ).toBe( 'went to the preload' );
		} );

		it( 'catches the write whatever query string it carries', async () => {
			const next = jest.fn();
			mockApiFetch.mockResolvedValueOnce( {} );

			await createDesignSaveMiddleware( ourId )(
				{ path: `/wp/v2/global-styles/${ ourId }?_locale=user`, method: 'PUT', data: {} },
				next
			);

			expect( next ).not.toHaveBeenCalled();
		} );

		it( 'does not match an id that merely starts the same', async () => {
			const next = jest.fn();

			await createDesignSaveMiddleware( 99 )(
				{ path: '/wp/v2/global-styles/991', method: 'PUT', data: {} },
				next
			);

			expect( mockApiFetch ).not.toHaveBeenCalled();
			expect( next ).toHaveBeenCalled();
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
