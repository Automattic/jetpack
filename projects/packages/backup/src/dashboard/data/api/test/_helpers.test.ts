import apiFetch from '@wordpress/api-fetch';
import { ApiError, apiCall, isAmbiguousFailure, requireTypes, toIntRewindId } from '../_helpers';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
// `__` prefixes a sentinel rather than returning its input, so a message that
// reached the reader untranslated is distinguishable from one that did not.
// The msgid is kept on the end because the branch that picks *which* string to
// show is the thing under test here — a bare sentinel would make every branch
// return the same value, and an assertion that cannot tell them apart passes
// whichever one runs. The rest of the module is preserved: replacing it
// wholesale would leave `sprintf` and `_n` undefined for everything in this
// file's module graph.
jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	__: jest.fn( ( text: string ) => `TRANSLATED:${ text }` ),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

describe( 'toIntRewindId', () => {
	test( 'returns the input unchanged when there is no decimal suffix', () => {
		expect( toIntRewindId( '1777035492' ) ).toBe( '1777035492' );
	} );

	test( 'strips a single decimal suffix', () => {
		expect( toIntRewindId( '1777035492.615' ) ).toBe( '1777035492' );
	} );

	test( 'strips everything from the first dot onwards', () => {
		expect( toIntRewindId( '1777035492.615.123' ) ).toBe( '1777035492' );
	} );
} );

describe( 'requireTypes', () => {
	test( 'emits the object form, keeping only the selected categories', () => {
		expect( requireTypes( { themes: true, plugins: false, sqls: true } ) ).toEqual( {
			themes: true,
			sqls: true,
		} );
	} );

	// Half the reason this helper exists. WPCOM selects the enabled
	// categories with a loose comparison, so a JSON array of names yields
	// its own integer indices — `[ "themes" ]` becomes `[ 0 ]` — and
	// those get treated as category names. An emptiness check would never
	// catch it, because the list is not empty.
	test( 'never produces an array', () => {
		const result = requireTypes( { themes: true, plugins: true } );

		expect( Array.isArray( result ) ).toBe( false );
		expect( result ).toEqual( { themes: true, plugins: true } );
	} );

	// The other half. Omitting `types` is not "ask for nothing" — WPCOM
	// reads an absent `types` as all six categories, so an unticked
	// checklist submitted a *full* download, and a full destructive
	// restore. Refusing is the only safe reading of an empty selection,
	// and it has to happen below the UI: the screens disable their
	// buttons, but the danger is in the request, not the button.
	test( 'refuses an empty selection rather than letting the key be omitted', () => {
		expect( () => requireTypes( { themes: false, plugins: false } ) ).toThrow( ApiError );
		expect( () => requireTypes( {} ) ).toThrow( ApiError );
	} );

	test( 'throws a branchable code', () => {
		// Captured rather than asserted inside the `catch`, which
		// `jest/no-conditional-expect` rejects: an assertion that only runs
		// when the throw happens passes silently when it does not.
		let thrown: unknown;
		try {
			requireTypes( {} );
		} catch ( error ) {
			thrown = error;
		}

		expect( thrown ).toBeInstanceOf( ApiError );
		expect( ( thrown as ApiError ).code ).toBe( 'no_types_selected' );
	} );
} );

describe( 'apiCall', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
	} );

	// A rejection with no `message` must still reach the reader in their own
	// language. Asserting on the thrown message pins the whole path: that
	// `__()` runs, and that what it returns is what lands on `ApiError`.
	test( 'translates the fallback message when the rejection carries none', async () => {
		mockedApiFetch.mockRejectedValue( { code: 'some_code' } );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			message: 'TRANSLATED:Request failed',
		} );
	} );

	// The enumerable side of the rule. `no_connected_jetpack` belongs to a
	// documented vocabulary where the code is the meaning, so it gets copy
	// of our own and the upstream message is not shown.
	test( 'maps the one code whose meaning is the code', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'capabilities_fetch_failed',
			message: 'Could not fetch site capabilities.',
			data: {
				status: 412,
				wpcom: { code: 'no_connected_jetpack', message: 'This site is not connected.' },
			},
		} );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			message:
				"TRANSLATED:The site doesn't appear to be connected. Backup requires an active Jetpack connection in order to function properly.",
		} );
	} );

	// The other side. `rewind_error` is a container, not a meaning: upstream
	// builds it from VaultPress's own sentence, from "Unexpected response
	// from VaultPress.", and from two 400s about free and multisite plans
	// that no amount of retrying will clear. Canned copy prescribed a retry
	// for all four, so the sentence has to come through.
	test( 'renders the reason for a code that spans unrelated situations', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'restore_initiate_failed',
			message: 'Could not start the backup restore.',
			data: {
				status: 400,
				wpcom: {
					code: 'rewind_error',
					message: 'You cannot enable Rewind for a free Jetpack site',
				},
			},
		} );

		const thrown = await apiCall( { path: '/x' } ).catch( ( e: ApiError ) => e );

		expect( thrown.message ).toContain( 'You cannot enable Rewind for a free Jetpack site' );
		// The frame attributes it, so the reader can see the English half is
		// a quotation rather than our own untranslated copy.
		expect( thrown.message ).toContain( 'Could not start the backup restore.' );
		expect( thrown.message ).toContain( 'WordPress.com said' );
	} );

	// `authorization_required` is a WordPress.com-wide generic. Its messages
	// distinguish "not allowed to rewind this site" from "not allowed to
	// query this state"; its code cannot. It must also not blame the
	// reader's account — `get_restore_status()` signs `as_blog`, so the
	// credential at fault there is the site's token.
	test( 'renders the reason for a generic code without blaming the account', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'restore_status_fetch_failed',
			message: 'Could not fetch restore progress.',
			data: {
				status: 401,
				wpcom: {
					code: 'authorization_required',
					message: 'You are not allowed to query this state',
				},
			},
		} );

		const thrown = await apiCall( { path: '/x' } ).catch( ( e: ApiError ) => e );

		expect( thrown.message ).toContain( 'You are not allowed to query this state' );
		expect( thrown.message ).not.toContain( 'account' );
	} );

	// "Anything you cannot enumerate, render" is the rule, not a list — so a
	// code nobody has seen before still gets its sentence through.
	test( 'renders the reason for a code it has never seen', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'capabilities_fetch_failed',
			message: 'Could not fetch site capabilities.',
			data: {
				status: 500,
				wpcom: { code: 'something_new_upstream', message: 'The vault is being migrated.' },
			},
		} );

		const thrown = await apiCall( { path: '/x' } ).catch( ( e: ApiError ) => e );

		expect( thrown.message ).toContain( 'The vault is being migrated.' );
	} );

	// The VaultPress refusal that arrives inside a 200, which carries a
	// sentence and no code at all. This is the headline case for rendering:
	// "a restore is already running" is the whole of what the reader needs
	// and no canned line can say it.
	test( 'renders a reason that arrived with no code beside it', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'restore_initiate_failed',
			message: 'Could not start the backup restore.',
			data: {
				status: 500,
				wpcom: { message: 'There is already a restore in progress' },
			},
		} );

		const thrown = await apiCall( { path: '/x' } ).catch( ( e: ApiError ) => e );

		expect( thrown.message ).toContain( 'There is already a restore in progress' );
	} );

	// A bare token is worse on screen than the bridge's sentence, so a
	// reason with no message degrades to the sentence rather than to
	// `rewind_error`.
	test( 'keeps the bridge message when the reason carries no sentence', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'capabilities_fetch_failed',
			message: 'Could not fetch site capabilities.',
			data: { status: 500, wpcom: { code: 'rewind_error' } },
		} );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			message: 'Could not fetch site capabilities.',
		} );
	} );

	// Upstream text is arbitrary, and it now goes through a `sprintf`
	// frame — so a percent sign in it is a live hazard. It is safe because
	// `sprintf` only ever interprets the *format*, never the arguments,
	// but "safe because of how a dependency works" is exactly the kind of
	// claim that deserves a test. A regression here would not merely
	// mangle the text: `@wordpress/i18n` logs a `console.error` on a
	// malformed format, and this repo's jest setup fails a test that logs
	// one, so this would go red rather than quiet.
	test.each( [
		[ 'a bare percent', 'Disk 95% full' ],
		[ 'a positional token', 'Value %1$s was rejected' ],
		[ 'a bare format token', 'Got %s and %d' ],
	] )( 'passes %s through the frame untouched', async ( _label, upstream ) => {
		mockedApiFetch.mockRejectedValue( {
			code: 'restore_initiate_failed',
			message: 'Could not start the backup restore.',
			data: { status: 500, wpcom: { code: 'rewind_error', message: upstream } },
		} );

		const thrown = await apiCall( { path: '/x' } ).catch( ( e: ApiError ) => e );

		expect( thrown.message ).toContain( upstream );
	} );

	// It still has to reach a support agent, so it travels on `data`
	// untouched — including for the code that got mapped instead of shown.
	test( 'passes the upstream reason through on data', async () => {
		const data = { status: 412, wpcom: { code: 'no_connected_jetpack' } };
		mockedApiFetch.mockRejectedValue( { code: 'capabilities_fetch_failed', data } );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( { data } );
	} );

	// A failure from the browser → site hop carries no `data` at all, and
	// reading into it must not throw a second error on top of the first.
	test( 'survives a rejection with no data', async () => {
		mockedApiFetch.mockRejectedValue( { code: 'fetch_error', message: 'Network down.' } );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			code: 'fetch_error',
			message: 'Network down.',
		} );
	} );
} );

describe( 'isAmbiguousFailure', () => {
	/**
	 * Force `navigator.onLine`, restoring it afterwards.
	 *
	 * @param value - What the browser should claim.
	 * @return A function that puts it back.
	 */
	function forceOnLine( value: boolean ) {
		const original = Object.getOwnPropertyDescriptor( window.navigator, 'onLine' );
		Object.defineProperty( window.navigator, 'onLine', { value, configurable: true } );
		return () => {
			if ( original ) {
				Object.defineProperty( window.navigator, 'onLine', original );
			}
		};
	}

	let restoreOnLine: () => void;

	beforeEach( () => {
		restoreOnLine = forceOnLine( true );
	} );

	afterEach( () => restoreOnLine() );

	// The question is "did our code get far enough to give a verdict",
	// and only a bridge-shaped failure carries one.
	test.each( [
		[ 'a transport failure the bridge wrapped', { status: 502, transport: { code: 'x' } }, true ],
		[ 'a gateway status with no transport payload', { status: 504 }, true ],
		[ 'a request timeout', { status: 408 }, true ],
		[ 'an upstream refusal', { status: 412 }, false ],
		[ 'an authorization failure', { status: 401 }, false ],
		// The `ok`-falsy branch: WordPress.com answered and said no, so
		// nothing was queued and a retry is safe at once.
		[ 'a refusal reported as 500', { status: 500 }, false ],
	] )( 'reads %s as ambiguous=%p', ( _label, data, expected ) => {
		expect( isAmbiguousFailure( new ApiError( 'restore_initiate_failed', 'x', data ) ) ).toBe(
			expected
		);
	} );

	// These carry no `data` at all — the failure happened before the
	// bridge could answer. They are the browser → site hop, which the
	// bridges' own vocabulary never describes.
	test.each( [
		[ 'a request that never completed', 'fetch_error' ],
		[ 'a non-JSON gateway page', 'invalid_json' ],
	] )( 'reads %s as ambiguous', ( _label, code ) => {
		expect( isAmbiguousFailure( new ApiError( code, 'x' ) ) ).toBe( true );
	} );

	test( 'reads any failure as unambiguous when the browser was offline', () => {
		restoreOnLine();
		restoreOnLine = forceOnLine( false );
		// Proof rather than assumption: the request never left, so
		// nothing can have started, and the reader keeps their retry.
		expect( isAmbiguousFailure( new ApiError( 'fetch_error', 'x' ) ) ).toBe( false );
	} );

	test( 'ignores anything that is not an ApiError', () => {
		expect( isAmbiguousFailure( new Error( 'boom' ) ) ).toBe( false );
	} );
} );
