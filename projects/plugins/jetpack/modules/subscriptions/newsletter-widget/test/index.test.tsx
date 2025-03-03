import { JetpackScriptData } from '@automattic/jetpack-script-data';
import '../src/index';

const mockRender = jest.fn();

jest.mock( '@wordpress/element', () => {
	const actualElement = jest.requireActual( '@wordpress/element' ); // Import the real module

	return {
		...actualElement, // Spread actual exports
		createRoot: () => ( {
			render: mockRender,
		} ),
		memo: component => component, // Add memo to the mock
	};
} );

const defaultScriptData = {
	site: {
		admin_url: 'https://example.com/wp-admin/',
		suffix: 'example.com',
	},
} as JetpackScriptData;

describe( 'Newsletter Widget Initialization', () => {
	beforeEach( () => {
		document.body.innerHTML = '';

		window.JetpackScriptData = defaultScriptData;

		mockRender.mockClear();
	} );

	it( 'does not create root when container is missing', () => {
		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'does not create root when config data is missing', () => {
		window.JetpackScriptData = { site: { admin_url: '', suffix: '' } } as JetpackScriptData;
		document.body.innerHTML = '<div id="newsletter-widget-app"></div>';

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );

		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'creates root and renders component when container and config are present', () => {
		const container = document.createElement( 'div' );
		container.id = 'newsletter-widget-app';
		document.body.appendChild( container );

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );

		expect( mockRender ).toHaveBeenCalled();
	} );
} );
