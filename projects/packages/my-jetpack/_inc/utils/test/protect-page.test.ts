import { getProtectPageUrl } from '../protect-page';

const mockStore: { resolved: boolean; modules?: Record< string, { activated: boolean } > } = {
	resolved: false,
};

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );
jest.mock( '@wordpress/data', () => ( {
	select: () => ( {
		hasFinishedResolution: () => mockStore.resolved,
		getJetpackModules: () => mockStore.modules,
	} ),
} ) );

const url = 'admin.php?page=jetpack-protect&p=firewall';

beforeAll( () => {
	window.myJetpackInitialState = {
		protectPageModuleUrls: { waf: url },
	} as unknown as Window[ 'myJetpackInitialState' ];
} );

afterAll( () => {
	delete window.myJetpackInitialState;
} );

describe( 'getProtectPageUrl', () => {
	it.each( [
		[ 'keeps the page-load URL before the modules load', false, undefined, url ],
		[
			'keeps it while the Protect page is on',
			true,
			{ 'protect-dashboard': { activated: true } },
			url,
		],
		[
			'drops it once the Protect page is switched off',
			true,
			{ 'protect-dashboard': { activated: false } },
			undefined,
		],
	] )( '%s', ( _, resolved, modules, expected ) => {
		mockStore.resolved = resolved;
		mockStore.modules = modules;

		expect( getProtectPageUrl( 'waf' ) ).toBe( expected );
	} );
} );
