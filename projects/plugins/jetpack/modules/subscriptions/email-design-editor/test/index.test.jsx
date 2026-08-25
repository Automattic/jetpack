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
 * @return {object} Props of the rendered editor element.
 */
function mountedEditorProps() {
	const [ tree ] = mockRender.mock.calls[ 0 ];

	// The entry renders the editor inside StrictMode.
	return tree.props.children.props;
}

describe( 'Email design editor entry point', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		delete window.JetpackEmailDesignEditor;
		mockRender.mockClear();
	} );

	it( 'does not render when the page provides no configuration', () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;

		loadEntryPoint();

		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'does not render when the container is missing', () => {
		window.JetpackEmailDesignEditor = {
			elementId: ELEMENT_ID,
			postId: 42,
			postType: 'wp_template',
		};

		loadEntryPoint();

		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'mounts the editor with the post it was given', () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;
		window.JetpackEmailDesignEditor = {
			elementId: ELEMENT_ID,
			postId: 42,
			postType: 'wp_template',
		};

		loadEntryPoint();

		expect( mockRender ).toHaveBeenCalledTimes( 1 );

		const [ tree ] = mockRender.mock.calls[ 0 ];
		expect( tree.props.children.type ).toBe( MockEmailEditor );

		const props = mountedEditorProps();

		expect( props.postId ).toBe( 42 );
		expect( props.postType ).toBe( 'wp_template' );
	} );

	it( 'passes the rest of the configuration through as the editor config', () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;
		window.JetpackEmailDesignEditor = {
			elementId: ELEMENT_ID,
			postId: 42,
			postType: 'wp_template',
			editor_settings: { allowedIframeStyleHandles: [ 'wp-block-library' ] },
			editor_theme: { version: 3 },
		};

		loadEntryPoint();

		expect( mountedEditorProps().config ).toEqual( {
			editor_settings: { allowedIframeStyleHandles: [ 'wp-block-library' ] },
			editor_theme: { version: 3 },
		} );
	} );

	it( 'keeps the mount details out of the editor config', () => {
		document.body.innerHTML = `<div id="${ ELEMENT_ID }"></div>`;
		window.JetpackEmailDesignEditor = {
			elementId: ELEMENT_ID,
			postId: 42,
			postType: 'wp_template',
			editor_theme: { version: 3 },
		};

		loadEntryPoint();

		const { config } = mountedEditorProps();

		// The editor reads its own `postId`/`postType` props and knows nothing about
		// the container. Leaving these in the config would put mount details into the
		// settings the editor hands to the block editor.
		expect( config ).not.toHaveProperty( 'elementId' );
		expect( config ).not.toHaveProperty( 'postId' );
		expect( config ).not.toHaveProperty( 'postType' );
	} );
} );
