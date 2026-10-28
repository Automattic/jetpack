import { renderHook } from '@testing-library/react';
import useAiProductPage from '..';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: ( source: string ) => `https://jetpack.com/redirect/?source=${ source }`,
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	isMyJetpackAvailable: () => true,
	useAutosaveAndRedirect: () => ( { autosaveAndRedirect: jest.fn(), isRedirecting: false } ),
} ) );

const adminUrl = 'https://example.com/wp-admin/';
const hubUrl = `${ adminUrl }admin.php?page=jetpack-ai`;

describe( 'useAiProductPage', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'an administrator to the Jetpack AI Hub when the site prints it', true, hubUrl, hubUrl ],
		[
			'everyone else to the public Jetpack AI page',
			false,
			hubUrl,
			'https://jetpack.com/redirect/?source=org-ai',
		],
	] )( 'sends %s', ( _, manageOptions, aiManageUrl, expected ) => {
		window.JetpackScriptData = {
			site: { admin_url: adminUrl },
			user: { current_user: { capabilities: { manage_options: manageOptions } } },
			myJetpack: { aiManageUrl },
		} as unknown as Window[ 'JetpackScriptData' ];

		const { result } = renderHook( () => useAiProductPage() );

		expect( result.current.productPageUrl ).toBe( expected );
	} );
} );
