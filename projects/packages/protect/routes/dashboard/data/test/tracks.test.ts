type Queue = unknown[][];
type TestWindow = { _tkq: Queue; JetpackScriptData: object; jetpackProtectTracks?: boolean };

/**
 * Record a view and a click with a fresh copy of the module, and return what reached the Tracks queue.
 *
 * @param scriptData - The page's `JetpackScriptData`.
 * @param allowed    - Whether PHP allowed Tracks.
 * @return The queued calls.
 */
async function queueFor( scriptData: object, allowed: boolean ): Promise< Queue > {
	const win = window as unknown as TestWindow;
	win._tkq = [];
	win.JetpackScriptData = scriptData;
	win.jetpackProtectTracks = allowed || undefined;
	await jest.isolateModulesAsync( async () => {
		const { recordEvent, recordViewOnce } = await import( '../tracks' );
		recordViewOnce( 'jetpack_protect_test_view', { variant: 2 } );
		recordEvent( 'jetpack_protect_test_click', { variant: 2 } );
	} );
	return win._tkq;
}

describe( 'tracks', () => {
	it.each( [
		[
			'identifies the user before the first event and tags each with the site',
			{
				user: { current_user: { wpcom: { ID: 7, login: 'wpcomuser' } } },
				site: { wpcom: { blog_id: 9 } },
			},
			true,
			[
				[ 'identifyUser', 7, 'wpcomuser' ],
				[ 'recordEvent', 'jetpack_protect_test_view', { blog_id: 9, variant: 2 } ],
				[ 'recordEvent', 'jetpack_protect_test_click', { blog_id: 9, variant: 2 } ],
			],
		],
		[
			'sends events without a user or site when there is no connection',
			{},
			true,
			[
				[ 'recordEvent', 'jetpack_protect_test_view', { variant: 2 } ],
				[ 'recordEvent', 'jetpack_protect_test_click', { variant: 2 } ],
			],
		],
		[
			'sends nothing when PHP didn’t allow Tracks',
			{ user: { current_user: { wpcom: { ID: 7, login: 'wpcomuser' } } } },
			false,
			[],
		],
	] )( '%s', async ( _, scriptData, allowed, expected ) => {
		await expect( queueFor( scriptData, allowed ) ).resolves.toEqual( expected );
	} );
} );
