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

const initialState = {
	jetpack: {
		initialState: {
			userData: {
				currentUser: { permissions: { manage_modules: true, publish_posts: true } },
			},
		},
		modules: { items: { wordads: { activated: true }, stats: { activated: true } } },
		pluginsData: { items: {} },
		search: { searchTerm: '' },
	},
};

describe( 'SettingsNavTabs with the Ads settings moved', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[
			'drops the Monetize tab once the Ads settings have a home',
			'admin.php?page=jetpack-monetize',
			0,
		],
		[ 'keeps the Monetize tab while they stay', undefined, 1 ],
	] )( '%s', ( _name, adsSettingsUrl, monetizeTabs ) => {
		window.JetpackScriptData = {
			myJetpack: { settingsConsolidation: Boolean( adsSettingsUrl ) },
			monetize: { adsSettingsUrl },
		};

		render(
			<MemoryRouter initialEntries={ [ '/traffic' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState }
		);

		expect( screen.getByRole( 'tab', { name: 'Traffic' } ) ).toBeInTheDocument();
		expect( screen.queryAllByRole( 'tab', { name: 'Monetize' } ) ).toHaveLength( monetizeTabs );
	} );
} );
