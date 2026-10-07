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

const buildInitialState = () => ( {
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
	it( 'has no Security tab on a site with every security module', () => {
		render(
			<MemoryRouter initialEntries={ [ '/traffic' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState: buildInitialState() }
		);

		expect( screen.getByRole( 'tab', { name: 'Traffic' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'Security' } ) ).not.toBeInTheDocument();
	} );
} );
