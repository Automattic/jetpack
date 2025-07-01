// Mock Jetpack Connection initial state
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacrmaneto' },
		},
	},
};

// Mock WordPress globals
global.wp = {
	i18n: {
		__: jest.fn( text => text ),
		_x: jest.fn( text => text ),
		_n: jest.fn( ( single, plural, number ) => ( number === 1 ? single : plural ) ),
		sprintf: jest.fn( format => format ),
	},
};

// Mock window.matchMedia
Object.defineProperty( window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation( query => ( {
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	} ) ),
} );

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	observe() {
		return null;
	}
	unobserve() {
		return null;
	}
	disconnect() {
		return null;
	}
};

// Work around WordPress data store registration conflicts
jest.mock( '@wordpress/data', () => {
	const ret = {};
	for ( const [ k, v ] of Object.entries(
		Object.getOwnPropertyDescriptors( jest.requireActual( '@wordpress/data' ) )
	) ) {
		Object.defineProperty( ret, k, { ...v, configurable: true } );
	}
	return ret;
} );

// Mock @wordpress/block-editor to prevent alignment property errors
jest.mock( '@wordpress/block-editor', () => {
	const useBlockProps = ( props = {} ) => {
		return {
			className: '',
			style: {},
			...props,
		};
	};

	useBlockProps.save = ( props = {} ) => {
		return {
			className: '',
			style: {},
			...props,
		};
	};

	return {
		...jest.requireActual( '@wordpress/block-editor' ),
		useBlockProps,
	};
} );
