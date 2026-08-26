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

	// The client half of the bridges' `data.wpcom`. Without this branch the
	// bridges' new reason would improve nothing anyone sees: every surface
	// that reports a failure renders `error.message`, and the message is one
	// fixed line per operation.
	test.each( [
		[
			'a lapsed connection',
			'no_connected_jetpack',
			'TRANSLATED:This site is not connected to Jetpack.',
		],
		[
			'a rejected token',
			'authorization_required',
			'TRANSLATED:Your WordPress.com account is not allowed to manage this site.',
		],
	] )( 'says what happened for %s', async ( _label, code, expected ) => {
		mockedApiFetch.mockRejectedValue( {
			code: 'capabilities_fetch_failed',
			message: 'Could not fetch site capabilities.',
			data: { status: 412, wpcom: { code } },
		} );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( { message: expected } );
	} );

	// The bridge's own code is not the one being read. Both fixtures below
	// carry the same one, and only the upstream half differs — so a
	// mapping wired to `code` instead of `data.wpcom.code` fails here.
	test( 'keeps the bridge message for an upstream code it does not know', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'capabilities_fetch_failed',
			message: 'Could not fetch site capabilities.',
			data: { status: 500, wpcom: { code: 'something_new_upstream' } },
		} );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			message: 'Could not fetch site capabilities.',
		} );
	} );

	// The reason is prose — a VaultPress refusal, which the bridge puts in
	// `message` precisely because nothing may branch on it. Rendering
	// unbounded upstream English at a reader who may not read English is
	// not an improvement on a translated generic line.
	test( 'never shows the upstream prose to the reader', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'restore_initiate_failed',
			message: 'Could not start the backup restore.',
			data: { status: 500, wpcom: { message: 'There is already a restore in progress' } },
		} );

		await expect( apiCall( { path: '/x' } ) ).rejects.toMatchObject( {
			message: 'Could not start the backup restore.',
		} );
	} );

	// It still has to reach a support agent, so it travels on `data`
	// untouched — including for the codes that did get mapped.
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
