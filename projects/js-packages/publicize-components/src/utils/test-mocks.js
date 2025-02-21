import { jest } from '@jest/globals';

// Dependencies mocks
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createSelector: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
	combineReducers: jest.fn( () => () => ( {} ) ),
	createRegistrySelector: jest.fn( fn => fn ),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
	isWpcomPlatformSite: jest.fn(),
	isJetpackSelfHostedSite: jest.fn(),
	isSimpleSite: jest.fn(),
	siteHasFeature: jest.fn(),
	getMyJetpackUrl: jest.fn( () => 'https://example.com/add-license' ),
} ) );

jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children, header } ) => (
		<div>
			{ header }
			{ children }
		</div>
	),
	AdminSection: ( { children } ) => <div>{ children }</div>,
	AdminSectionHero: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	GlobalNotices: () => null,
	Button: ( { children, disabled, onClick } ) => (
		<button disabled={ disabled } onClick={ onClick }>
			{ children }
		</button>
	),
	Text: ( { children } ) => <div>{ children }</div>,
	ContextualUpgradeTrigger: ( { description } ) => <div>{ description }</div>,
	getRedirectUrl: jest.fn(),
	useBreakpointMatch: jest.fn().mockReturnValue( [ false ] ),
} ) );

jest.mock( './', () => ( {
	...jest.requireActual( './' ),
	getSocialScriptData: jest.fn( () => ( {
		plugin_info: {
			social: { version: '1.0.0' },
			jetpack: { version: '1.0.0' },
		},
	} ) ),
	hasSocialPaidFeatures: jest.fn( () => false ),
} ) );

// Store
const defaultStore = {
	getSocialModuleSettings: () => ( { publicize: true } ),
	getSocialSettings: () => ( { showPricingPage: false } ),
	isSavingSocialModuleSettings: () => false,
};

export const mockStore = ( overrides = {} ) => {
	const store = { ...defaultStore, ...overrides };
	jest.requireMock( '@wordpress/data' ).useSelect.mockImplementation( fn => fn( () => store ) );
};
