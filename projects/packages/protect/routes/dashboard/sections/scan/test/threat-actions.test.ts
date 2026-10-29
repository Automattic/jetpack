import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { recordEvent } from '../../../data/tracks';
import { setScan, useScan } from '../store';
import {
	deleteSoftware,
	deleteThreatRow,
	fixThreat,
	fixThreats,
	ignoreThreat,
	ignoreThreats,
	unignoreThreat,
} from '../threat-actions';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/tracks', () => ( { recordEvent: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const threat = { id: 7, title: 'Malicious code found in file: a.php' };

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [ threat ], ignored: [] },
};

describe( 'ignoreThreat', () => {
	it( 'moves the threat to the ignored list, and the notice’s Undo unignores it', async () => {
		mockApiFetch.mockResolvedValue( { hasPlan: true, url: '#', error: false, threats: [] } );
		const { result } = renderHook( () => useScan() );

		await act( () => ignoreThreat( threat ) );

		expect( result.current?.threats ).toEqual( [] );
		expect( result.current?.ignored ).toEqual( [ { ...threat, status: 'ignored' } ] );

		const [ notice ] = select( noticesStore ).getNotices();
		expect( notice ).toMatchObject( {
			type: 'snackbar',
			explicitDismiss: false,
			content: 'Ignored the threat in a.php.',
		} );
		expect( notice.icon ).toBeTruthy();
		await act( async () => notice.actions[ 0 ].onClick() );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/threats/7/unignore',
			method: 'POST',
		} );
		expect( result.current?.ignored ).toEqual( [] );
	} );
} );

describe( 'threat notices', () => {
	it( 'offer View while the action runs, which opens that threat and keeps the notice', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const open = jest.fn();
		const fixable = { ...threat, id: 10 };

		fixThreat( fixable, open );

		const notice = select( noticesStore )
			.getNotices()
			.find( item => item.id === 'jetpack-protect-threat-action-10' );
		expect( notice ).toMatchObject( {
			status: 'info',
			explicitDismiss: true,
			icon: null,
			content: 'Fixing the threat in a.php…',
		} );

		// The snackbar removes the notice before running its action.
		dispatch( noticesStore ).removeNotice( notice.id );
		notice.actions[ 0 ].onClick();

		expect( open ).toHaveBeenCalledWith( fixable );
		expect( select( noticesStore ).getNotices() ).toContainEqual(
			expect.objectContaining( { id: notice.id, content: 'Fixing the threat in a.php…' } )
		);
	} );

	it( 'keep one snackbar per threat, so acting on one doesn’t replace another’s', async () => {
		mockApiFetch.mockResolvedValue( {} );
		const other = { id: 8, title: 'Malicious code found in file: b.php' };
		setScan( current => ( { ...current, threats: [ threat, other ] } ) );

		await act( () => ignoreThreat( { ...threat, id: 9 } ) );
		await act( () => ignoreThreat( other ) );

		expect(
			select( noticesStore )
				.getNotices()
				.map( notice => notice.content )
		).toEqual(
			expect.arrayContaining( [ 'Ignored the threat in a.php.', 'Ignored the threat in b.php.' ] )
		);
	} );
} );

describe( 'bulk actions', () => {
	const fileThreat = ( id: number ) => ( {
		id,
		title: `Malicious code found in file: ${ id }.php`,
	} );
	const bulkNotices = () =>
		select( noticesStore )
			.getNotices()
			.filter( notice => notice.id.includes( 'bulk' ) );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'reports a batch in one snackbar, and Undo unignores only the threats that were ignored', async () => {
		dispatch( noticesStore ).removeAllNotices( 'snackbar' );
		const [ a, b, c ] = [ fileThreat( 31 ), fileThreat( 32 ), fileThreat( 33 ) ];
		setScan( current => ( { ...current, threats: [ a, b, c ], ignored: [] } ) );
		mockApiFetch
			.mockReset()
			.mockImplementation( ( { path } ) =>
				path.includes( '/32/' ) ? Promise.reject( {} ) : Promise.resolve( {} )
			);
		const { result } = renderHook( () => useScan() );

		await act( () => ignoreThreats( [ a, b, c ] ) );

		expect( result.current?.threats?.map( item => item.id ) ).toEqual( [ 32 ] );
		const [ notice ] = bulkNotices();
		expect( bulkNotices() ).toHaveLength( 1 );
		expect( notice ).toMatchObject( {
			status: 'error',
			content: 'Ignored 2 of 3 threats. Try the others again.',
		} );
		expect(
			select( noticesStore )
				.getNotices()
				.filter( item => ! item.id.includes( 'bulk' ) )
		).toEqual( [] );

		mockApiFetch.mockClear();
		await act( async () => notice.actions[ 0 ].onClick() );
		// The failed threat isn't left busy, so it can be tried again.
		await act( () => ignoreThreat( b ) );

		expect( mockApiFetch.mock.calls.map( ( [ { path } ] ) => path ) ).toEqual( [
			'/jetpack/v4/protect-dashboard/scan/threats/31/unignore',
			'/jetpack/v4/protect-dashboard/scan/threats/33/unignore',
			'/jetpack/v4/protect-dashboard/scan/threats/32/ignore',
		] );
	} );

	// Each threat's fix answers with these statuses in turn, repeating the last; `reject`, `missing` and `limited` fail it.
	it.each( [
		[ 'success', 'Fixed 2 threats.', [ 'fixed' ], [ 'fixed' ] ],
		[ 'success', 'Fixed 2 threats.', [ 'in_progress', 'reject', 'fixed' ], [ 'fixed' ] ],
		[
			'info',
			'Fixed 1 of 2 threats. 1 fix is taking longer than expected. Check back in a few minutes.',
			[ 'in_progress', 'reject' ],
			[ 'fixed' ],
		],
		[
			'error',
			'Fixed 1 of 2 threats. 1 threat couldn’t be fixed. Fix it on its own to see why.',
			[ 'in_progress', 'missing' ],
			[ 'fixed' ],
		],
		[
			'info',
			'Fixed 1 of 2 threats. 1 fix is taking longer than expected. Check back in a few minutes.',
			[ 'in_progress', 'limited' ],
			[ 'fixed' ],
		],
		[
			'error',
			'Fixed 1 of 2 threats. 1 threat couldn’t be fixed. Fix it on its own to see why.',
			[ 'fixed' ],
			[ 'not_fixed' ],
		],
		[
			'error',
			'2 threats couldn’t be fixed. Fix them one at a time to see why.',
			[ 'not_fixed' ],
			[ 'not_fixed' ],
		],
		[
			'info',
			'Fixed 1 of 2 threats. 1 fix is taking longer than expected. Check back in a few minutes.',
			[ 'fixed' ],
			[ 'in_progress' ],
		],
	] )( 'reports a batch of fixes as %s: %s', async ( status, content, ...answers: string[][] ) => {
		jest.useFakeTimers();
		dispatch( noticesStore ).removeAllNotices( 'snackbar' );
		const ids = [ 41, 42 ];
		mockApiFetch.mockReset().mockImplementation( ( { path } ) => {
			const queue = answers[ ids.findIndex( id => path.includes( `/${ id }/` ) ) ];
			const answer = queue.length > 1 ? queue.shift() : queue[ 0 ];
			const errors: Record< string, object > = {
				reject: {},
				missing: { data: { status: 404 } },
				limited: { data: { status: 429 } },
			};
			if ( answer in errors ) {
				return Promise.reject( errors[ answer ] );
			}
			return Promise.resolve( { status: answer } );
		} );

		const done = fixThreats( ids.map( fileThreat ) );
		await jest.runAllTimersAsync();
		await done;

		expect( bulkNotices() ).toEqual( [ expect.objectContaining( { status, content } ) ] );
	} );

	it( 'leaves a fix that deletes software out of a batch', async () => {
		mockApiFetch.mockReset().mockResolvedValue( { status: 'fixed' } );
		const deleting = {
			...fileThreat( 61 ),
			signature: 'Vulnerable.WP.Extension',
			fixable: { fixer: 'delete' as const },
		};

		await act( () => fixThreats( [ deleting, fileThreat( 62 ) ] ) );

		expect( mockApiFetch.mock.calls.map( ( [ { path } ] ) => path ) ).toEqual( [
			'/jetpack/v4/protect-dashboard/scan/threats/62/fix',
		] );
	} );

	// A fix's start answers `in_progress`, so its polls must wait outside the five slots.
	it.each( [
		[ 'ignoreThreats', ignoreThreats, {} ],
		[ 'fixThreats', fixThreats, { status: 'in_progress' } ],
	] )(
		'%s keeps five requests in flight, and every queued threat busy until its turn',
		async ( _name, run, answer ) => {
			jest.useFakeTimers();
			const threats = [ 51, 52, 53, 54, 55, 56, 57 ].map( fileThreat );
			setScan( current => ( { ...current, threats, ignored: [] } ) );
			const pending: Array< () => void > = [];
			mockApiFetch
				.mockReset()
				.mockImplementation( ( { method } ) =>
					method === 'POST'
						? new Promise( resolve => pending.push( () => resolve( answer ) ) )
						: Promise.resolve( { status: 'fixed' } )
				);

			const done = run( threats );
			await act( () => ignoreThreat( threats[ 6 ] ) );

			expect( mockApiFetch ).toHaveBeenCalledTimes( 5 );
			while ( pending.length ) {
				await act( async () => pending.shift()?.() );
			}
			expect( mockApiFetch ).toHaveBeenCalledTimes( 7 );
			await act( async () => {
				await jest.runAllTimersAsync();
				await done;
			} );
		}
	);
} );

describe( 'threat action Tracks events', () => {
	const scan = { hasPlan: true, url: '#', error: false, threats: [] };

	// Runs the fix's polling out on fake timers, past the point where the dashboard gives up.
	const fixTimingOut = async ( item: Parameters< typeof fixThreat >[ 0 ] ) => {
		jest.useFakeTimers();
		mockApiFetch.mockClear();
		try {
			const fixing = fixThreat( item );
			await jest.runAllTimersAsync();
			await fixing;
		} finally {
			jest.useRealTimers();
		}
		// One start and 100 polls: the polling cap ended the fix, not an error.
		expect( mockApiFetch ).toHaveBeenCalledTimes( 101 );
	};

	it.each( [
		[ 'a fix', fixThreat, Promise.resolve( { status: 'fixed', scan } ), 'fix_threat', 'success' ],
		[
			'a fix Scan gave up on',
			fixThreat,
			Promise.resolve( { status: 'not_fixed', scan } ),
			'fix_threat',
			'failed',
		],
		[ 'a fix that didn’t start', fixThreat, Promise.reject( {} ), 'fix_threat', 'failed' ],
		[
			'a fix that never finishes',
			fixTimingOut,
			Promise.resolve( { status: 'in_progress' } ),
			'fix_threat',
			'failed',
		],
		[ 'an ignore', ignoreThreat, Promise.resolve( {} ), 'ignore_threat', 'success' ],
		[ 'a failed ignore', ignoreThreat, Promise.reject( {} ), 'ignore_threat', 'failed' ],
		[ 'an unignore', unignoreThreat, Promise.resolve( {} ), 'unignore_threat', 'success' ],
		[ 'a failed unignore', unignoreThreat, Promise.reject( {} ), 'unignore_threat', 'failed' ],
	] )( 'record the Scan page’s events for %s', async ( _name, action, response, event, result ) => {
		( recordEvent as jest.Mock ).mockClear();
		mockApiFetch.mockReturnValue( response );

		await act( async () => {
			await action( { ...threat, id: `tracks-${ _name }` } );
		} );

		expect( ( recordEvent as jest.Mock ).mock.calls ).toEqual( [
			[ `jetpack_scan_${ event }_click` ],
			[ `jetpack_scan_${ event }_${ result }` ],
		] );
	} );
} );

describe( 'deleteSoftware', () => {
	it( 'drops every threat in the deleted plugin, and only those', async () => {
		mockApiFetch.mockResolvedValue( { ok: true } );
		const inPlugin = ( id: number, slug: string ) => ( {
			id,
			title: 'Vulnerable plugin',
			extension: { type: 'plugins' as const, slug, name: slug, version: '1.0' },
		} );
		setScan( current => ( {
			...current,
			threats: [ inPlugin( 1, 'akismet' ), inPlugin( 2, 'hello' ), inPlugin( 3, 'akismet' ) ],
			ignored: [ inPlugin( 4, 'akismet' ) ],
		} ) );
		const { result } = renderHook( () => useScan() );

		await act( () => deleteSoftware( inPlugin( 1, 'akismet' ) ) );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/software/delete',
			method: 'POST',
			data: { type: 'plugins', slug: 'akismet' },
		} );
		expect( result.current?.threats?.map( item => item.id ) ).toEqual( [ 2 ] );
		expect( result.current?.ignored ).toEqual( [] );
	} );

	it.each( [
		[ 'the server’s reason', { message: 'Nope' }, 'Nope' ],
		[ 'a fallback naming the software', {}, 'akismet couldn’t be deleted.' ],
	] )(
		'resolves to %s when the delete fails, and keeps the threats',
		async ( _name, e, reason ) => {
			mockApiFetch.mockRejectedValue( e );
			const inPlugin = {
				id: 1,
				title: 'Vulnerable plugin',
				extension: { type: 'plugins' as const, slug: 'akismet', name: 'akismet', version: '1.0' },
			};
			setScan( current => ( { ...current, threats: [ inPlugin ], ignored: [] } ) );
			const { result } = renderHook( () => useScan() );

			await expect( deleteSoftware( inPlugin ) ).resolves.toBe( reason );

			expect( result.current?.threats ).toEqual( [ inPlugin ] );
		}
	);

	it( 'waits for a running action on any threat in the same plugin', async () => {
		const inPlugin = ( id: number ) => ( {
			id,
			title: 'Vulnerable plugin',
			extension: { type: 'plugins' as const, slug: 'busy', name: 'Busy', version: '1.0' },
		} );
		setScan( current => ( { ...current, threats: [ inPlugin( 20 ), inPlugin( 21 ) ] } ) );
		mockApiFetch.mockReset().mockReturnValue( new Promise( () => {} ) );
		fixThreat( inPlugin( 21 ) );

		const error = await deleteSoftware( inPlugin( 20 ) );

		expect( error ).toMatch( /^Busy can’t be deleted while/ );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'deleteThreatRow', () => {
	const inOption = ( id: number ) => ( {
		id,
		title: 'Database threat',
		database: { table: 'wp_options', pkColumn: 'option_id', pkValue: String( id ) },
	} );

	it( 'drops only the deleted option’s threat', async () => {
		// The delete refreshes History, which answers with a list.
		mockApiFetch
			.mockReset()
			.mockImplementation( ( { path }: { path: string } ) =>
				Promise.resolve(
					path.endsWith( '/history' ) ? [] : { threat: { ...inOption( 30 ), status: 'fixed' } }
				)
			);
		setScan( current => ( { ...current, threats: [ inOption( 30 ), inOption( 31 ) ] } ) );
		const { result } = renderHook( () => useScan() );

		let error: string | null = 'not run';
		await act( async () => {
			error = await deleteThreatRow( inOption( 30 ) );
		} );

		expect( error ).toBeNull();

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/threats/30/row',
			method: 'DELETE',
		} );
		expect( result.current?.threats?.map( item => item.id ) ).toEqual( [ 31 ] );
	} );

	it.each( [
		[ 'the server’s reason', { message: 'Nope' }, 'Nope' ],
		[ 'a fallback', {}, 'The option couldn’t be deleted.' ],
	] )( 'resolves to %s when the delete fails, and keeps the threat', async ( _name, e, reason ) => {
		mockApiFetch.mockReset().mockRejectedValue( e );
		setScan( current => ( { ...current, threats: [ inOption( 32 ) ] } ) );
		const { result } = renderHook( () => useScan() );

		await expect( deleteThreatRow( inOption( 32 ) ) ).resolves.toBe( reason );

		expect( result.current?.threats?.map( item => item.id ) ).toEqual( [ 32 ] );
	} );
} );
