import { render } from 'test/test-utils';
import Writing from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'state/feature-check', () => ( {
	getActiveFeatureDetails: () => () => new Promise( () => {} ),
} ) );
jest.mock( '../composing', () => () => null );
jest.mock( '../custom-content-types', () => () => null );
jest.mock( '../post-by-email', () => () => null );
jest.mock( '../theme-enhancements', () => () => null );
jest.mock( '../widgets', () => () => null );
jest.mock( '../writing-media', () => () => null );

const buildState = searchTerm => ( {
	jetpack: {
		connection: {
			connectUrl: '',
			status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
			user: { currentUser: { isConnected: true } },
		},
		initialState: {
			userData: { currentUser: { permissions: { manage_modules: true } } },
		},
		modules: { items: { latex: { module: 'latex', name: 'Beautiful Math' } } },
		search: { searchTerm },
		settings: { items: {} },
	},
} );

describe( 'Writing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'renders', 'on the tab while the settings flag is off', false, '', true ],
		[ 'renders nothing', 'on the tab once the flag is on', true, '', false ],
		[ 'renders', 'for a search once the flag is on', true, 'latex', true ],
	] )(
		'%s for a site whose only Writing module Features switches, %s',
		( _verb, _when, flag, searchTerm, shown ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

			const { container } = render( <Writing active searchTerm={ searchTerm } />, {
				initialState: buildState( searchTerm ),
			} );

			expect( container.childElementCount > 0 ).toBe( shown );
		}
	);
} );
