type Queue = unknown[][];
type TestWindow = { _tkq: Queue; JetpackScriptData: object };

/**
 * Record a view and a click with a fresh copy of the module, and return what reached the Tracks queue.
 *
 * @param scriptData - The page's `JetpackScriptData`.
 * @return The queued calls.
 */
async function queueFor( scriptData: object ): Promise< Queue > {
	const win = window as unknown as TestWindow;
	win._tkq = [];
	win.JetpackScriptData = scriptData;
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
			[
				[ 'identifyUser', 7, 'wpcomuser' ],
				[ 'recordEvent', 'jetpack_protect_test_view', { blog_id: 9, variant: 2 } ],
				[ 'recordEvent', 'jetpack_protect_test_click', { blog_id: 9, variant: 2 } ],
			],
		],
		[
			'sends events without a user or site when there is no connection',
			{},
			[
				[ 'recordEvent', 'jetpack_protect_test_view', { variant: 2 } ],
				[ 'recordEvent', 'jetpack_protect_test_click', { variant: 2 } ],
			],
		],
	] )( '%s', async ( _, scriptData, expected ) => {
		await expect( queueFor( scriptData ) ).resolves.toEqual( expected );
	} );
} );
