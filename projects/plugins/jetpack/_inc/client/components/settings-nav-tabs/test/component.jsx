import { MemoryRouter } from 'react-router';
import { render, screen } from 'test/test-utils';
import SettingsNavTabs from '../index';

jest.mock( 'components/data/query-site-plugins', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( 'components/search', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const buildInitialState = protectPage => ( {
	jetpack: {
		initialState: {
			userData: {
				currentUser: {
					permissions: { manage_modules: true, publish_posts: true },
				},
			},
		},
		modules: {
			items: {
				'account-protection': { activated: true },
				monitor: { activated: true },
				protect: { activated: true },
				'protect-dashboard': { activated: protectPage },
				sso: { activated: true },
				stats: { activated: true },
				waf: { activated: true },
			},
		},
		pluginsData: { items: {} },
		search: { searchTerm: '' },
	},
} );

describe( 'SettingsNavTabs', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	// Atomic keeps the tab for the first release: the Protect page stays off there.
	it.each( [
		[ 'has no Security tab on a self-hosted site', undefined, true, false ],
		[ 'keeps the Security tab on an Atomic site', 'woa', false, true ],
	] )( '%s with every security module', ( _name, host, protectPage, hasSecurityTab ) => {
		window.JetpackScriptData = { site: { host } };

		render(
			<MemoryRouter initialEntries={ [ '/traffic' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState: buildInitialState( protectPage ) }
		);

		expect( screen.getByRole( 'tab', { name: 'Traffic' } ) ).toBeInTheDocument();
		expect( screen.queryAllByRole( 'tab', { name: 'Security' } ) ).toHaveLength(
			hasSecurityTab ? 1 : 0
		);
	} );
} );
