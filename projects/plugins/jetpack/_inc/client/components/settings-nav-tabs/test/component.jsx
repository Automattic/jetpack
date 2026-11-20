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

const buildInitialState = ( protectPage, extraModules = {}, settingsTabs = null ) => ( {
	jetpack: {
		initialState: {
			userData: {
				currentUser: {
					permissions: { manage_modules: true, publish_posts: true },
				},
			},
			siteData: { hasProtectPage: protectPage, settingsTabs },
		},
		modules: {
			items: {
				'account-protection': { activated: true },
				monitor: { activated: true },
				protect: { activated: true },
				sso: { activated: true },
				stats: { activated: true },
				waf: { activated: true },
				...extraModules,
			},
		},
		pluginsData: { items: {} },
		search: { searchTerm: '' },
	},
} );

describe( 'SettingsNavTabs', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
		delete window.CUSTOM_CONTENT_TYPE__INITIAL_STATE;
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

	it.each( [
		[ 'Performance', 'the image CDN', 'photon' ],
		[ 'Sharing', 'Social', 'publicize' ],
		[ 'Sharing', 'Sharing buttons', 'sharedaddy' ],
		[ 'Sharing', 'Like buttons', 'likes' ],
		[ 'Writing', 'Copy Post', 'copy-post' ],
		[ 'Writing', 'Markdown', 'markdown' ],
		[ 'Writing', 'custom content types', null ],
		[ 'Discussion', 'Comments', 'comments' ],
		[ 'Reader', 'the Reader', 'wpcom-reader' ],
		[ 'Monetize', 'Ads', 'wordads' ],
	] )( 'shows a %s tab for %s (%s) while settings stay here', ( tab, _name, module ) => {
		window.JetpackScriptData = { site: {} };
		// A null module stands for custom content types, which the tab reads from CUSTOM_CONTENT_TYPE__INITIAL_STATE.
		window.CUSTOM_CONTENT_TYPE__INITIAL_STATE = { active: ! module };

		render(
			<MemoryRouter initialEntries={ [ '/traffic' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState: buildInitialState( true, module ? { [ module ]: { activated: true } } : {} ) }
		);

		expect( screen.getByRole( 'tab', { name: tab } ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'only the tabs the server lists', [ 'security', 'earn' ], [ 'Security', 'Monetize' ] ],
		[ 'no nav when none is left', [], [] ],
	] )( 'gives admins %s once settings move out', ( _name, settingsTabs, tabs ) => {
		window.JetpackScriptData = { site: {} };
		window.CUSTOM_CONTENT_TYPE__INITIAL_STATE = { active: true };
		const everyTabModule = {
			photon: { activated: true },
			publicize: { activated: true },
			comments: { activated: true },
			'wpcom-reader': { activated: true },
			wordads: { activated: true },
		};

		render(
			<MemoryRouter initialEntries={ [ '/security' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState: buildInitialState( false, everyTabModule, settingsTabs ) }
		);

		expect( screen.queryAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( tabs );
	} );
} );
