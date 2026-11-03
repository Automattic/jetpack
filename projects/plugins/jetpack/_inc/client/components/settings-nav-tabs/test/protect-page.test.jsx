import { MemoryRouter, useLocation } from 'react-router';
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
				currentUser: { permissions: { manage_modules: true, publish_posts: true } },
			},
		},
		modules: {
			items: {
				protect: { activated: true },
				sso: { activated: true },
				stats: { activated: true },
				...( protectPage && { 'protect-dashboard': { activated: true } } ),
			},
		},
		pluginsData: { items: {} },
		search: { searchTerm: '' },
	},
} );

const Pathname = () => <output>{ useLocation().pathname }</output>;

const renderAt = ( path, protectPage ) =>
	render(
		<MemoryRouter initialEntries={ [ path ] }>
			<SettingsNavTabs />
			<Pathname />
		</MemoryRouter>,
		{ initialState: buildInitialState( protectPage ) }
	);

describe( 'SettingsNavTabs with the Protect page', () => {
	it.each( [
		[ 'drops the Security tab when the Protect page is on', true, 0 ],
		[ 'keeps the Security tab when the Protect page is off', false, 1 ],
	] )( '%s', ( _name, protectPage, securityTabs ) => {
		renderAt( '/traffic', protectPage );

		expect( screen.getByRole( 'tab', { name: 'Traffic' } ) ).toBeInTheDocument();
		expect( screen.queryAllByRole( 'tab', { name: 'Security' } ) ).toHaveLength( securityTabs );
	} );

	it.each( [
		[ '/settings', true, '/traffic' ],
		[ '/settings', false, '/settings' ],
		[ '/settings?term=sso', true, '/settings' ],
	] )( 'leaves %s (Protect page %s) on %s', ( path, protectPage, expected ) => {
		renderAt( path, protectPage );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( expected );
	} );
} );
