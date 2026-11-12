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

const buildInitialState = ( protectPage, extraModules = {} ) => ( {
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

	const searchAndVideoPress = { search: { activated: true }, videopress: { activated: true } };

	it.each( [
		[ 'shows', 'while the settings flag is off', false, searchAndVideoPress, 1 ],
		[ 'hides', 'once the flag is on', true, searchAndVideoPress, 0 ],
		[
			'shows',
			'with the image CDN once the flag is on',
			true,
			{ ...searchAndVideoPress, photon: { activated: true } },
			1,
		],
	] )( '%s the Performance tab %s', ( _verb, _when, flag, modules, tabs ) => {
		window.JetpackScriptData = { site: {}, myJetpack: { settingsConsolidation: flag } };

		render(
			<MemoryRouter initialEntries={ [ '/traffic' ] }>
				<SettingsNavTabs />
			</MemoryRouter>,
			{ initialState: buildInitialState( true, modules ) }
		);

		expect( screen.queryAllByRole( 'tab', { name: 'Performance' } ) ).toHaveLength( tabs );
	} );

	it.each( [
		[ 'shows', 'Sharing', 'Social', 'publicize', false, 1 ],
		[ 'hides', 'Sharing', 'Social', 'publicize', true, 0 ],
		[ 'shows', 'Writing', 'Copy Post', 'copy-post', false, 1 ],
		[ 'hides', 'Writing', 'Copy Post', 'copy-post', true, 0 ],
		[ 'shows', 'Writing', 'custom content types', null, false, 1 ],
		[ 'hides', 'Writing', 'custom content types', null, true, 0 ],
	] )(
		'%s a %s tab only %s would fill with the settings flag %s',
		( _verb, tab, _name, module, flag, tabs ) => {
			window.JetpackScriptData = { site: {}, myJetpack: { settingsConsolidation: flag } };
			// A null module stands for custom content types, which the tab reads from CUSTOM_CONTENT_TYPE__INITIAL_STATE.
			window.CUSTOM_CONTENT_TYPE__INITIAL_STATE = { active: ! module };

			render(
				<MemoryRouter initialEntries={ [ '/traffic' ] }>
					<SettingsNavTabs />
				</MemoryRouter>,
				{
					initialState: buildInitialState(
						true,
						module ? { [ module ]: { activated: true } } : {}
					),
				}
			);

			expect( screen.queryAllByRole( 'tab', { name: tab } ) ).toHaveLength( tabs );
		}
	);
} );
