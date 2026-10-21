type Queue = unknown[][];
type TestWindow = { _tkq: Queue; JetpackScriptData: object };

/**
 * Record a view and a click with a fresh copy of the module, and return what reached the Tracks queue.
 *
 * @param scriptData - The page's `JetpackScriptData`.
 * @return The queued calls.
 */
function queueFor( scriptData: object ): Queue {
	const win = window as unknown as TestWindow;
	win._tkq = [];
	win.JetpackScriptData = scriptData;
	jest.isolateModules( () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a fresh require.
		const { recordEvent, recordViewOnce } = require( '../tracks' );
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
	] )( '%s', ( _, scriptData, expected ) => {
		expect( queueFor( scriptData ) ).toEqual( expected );
	} );
} );
