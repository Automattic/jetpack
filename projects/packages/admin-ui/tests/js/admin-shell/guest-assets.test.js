import { applyGuestAssets } from '../../../src/admin-shell/guest-assets';

// jsdom has no fetch to spy on.
global.fetch ??= () => Promise.reject( new Error( 'Not mocked' ) );

const respondWith = html => {
	jest.spyOn( global, 'fetch' ).mockResolvedValue( {
		ok: true,
		status: 200,
		json: () => Promise.resolve( { success: true, data: { html } } ),
	} );
};

afterEach( () => {
	delete window.jetpackShellTestConfig;
	delete window.jetpackShellTestRuns;
} );

describe( 'applyGuestAssets', () => {
	it( "keeps the host's value of a global a guest script reassigns, with the guest's keys merged in", async () => {
		window.jetpackShellTestConfig = { consumer_slug: 'my-jetpack' };
		respondWith(
			'<script>var jetpackShellTestConfig = { consumer_slug: "jetpack-forms", formsOnly: true };</script>'
		);

		const added = await applyGuestAssets( '/wp-admin/admin-ajax.php', 'jetpack-forms' );

		expect( window.jetpackShellTestConfig ).toEqual( {
			consumer_slug: 'my-jetpack',
			formsOnly: true,
		} );
		expect( added.keptGlobals ).toEqual( [ 'jetpackShellTestConfig' ] );
	} );

	it( 'sends what the host page printed, so the endpoint can leave it out', async () => {
		respondWith( '' );
		const printed = { scriptData: { site: 'a1b2c3d4e5f6' }, inline: [ '0123456789ab' ] };

		await applyGuestAssets( '/wp-admin/admin-ajax.php?nonce=n', 'jetpack-forms', printed );

		const [ url, options ] = global.fetch.mock.lastCall;
		expect( url.searchParams.get( 'member' ) ).toBe( 'jetpack-forms' );
		expect( options.method ).toBe( 'POST' );
		expect( JSON.parse( options.body.get( 'printed' ) ) ).toEqual( printed );
	} );

	it( 'skips an inline script the page already ran, even without an id', async () => {
		const text = 'window.jetpackShellTestRuns = ( window.jetpackShellTestRuns || 0 ) + 1;';
		const script = document.createElement( 'script' );
		script.textContent = text;
		document.head.append( script );
		respondWith( `<script>${ text }</script>` );

		await applyGuestAssets( '/wp-admin/admin-ajax.php', 'jetpack-forms' );

		expect( window.jetpackShellTestRuns ).toBe( 1 );
	} );
} );
