import '../src/index';

const mockRender = jest.fn();

jest.mock( '@wordpress/element', () => {
	return {
		createRoot: () => ( {
			render: mockRender,
		} ),
		createElement: () => {},
	};
} );

describe( 'Newsletter Widget Initialization', () => {
	beforeEach( () => {
		// Reset the DOM
		document.body.innerHTML = '';
		// Reset window config
		delete window.jetpackNewsletterWidgetConfigData;
		// Clear mock
		mockRender.mockClear();
	} );

	it( 'does not create root when container is missing', () => {
		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'does not create root when config data is missing', () => {
		document.body.innerHTML = '<div id="newsletter-widget-app"></div>';
		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		expect( mockRender ).not.toHaveBeenCalled();
	} );

	it( 'creates root and renders component when container and config are present', () => {
		const container = document.createElement( 'div' );
		container.id = 'newsletter-widget-app';
		document.body.appendChild( container );

		window.jetpackNewsletterWidgetConfigData = {
			hostname: 'example.com',
			adminUrl: 'https://example.com/wp-admin/',
		};

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );

		expect( mockRender ).toHaveBeenCalled();
	} );
} );
