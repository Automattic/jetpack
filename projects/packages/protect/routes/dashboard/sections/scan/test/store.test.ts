import apiFetch from '@wordpress/api-fetch';
import { SCAN_PATH, getScan, refreshScan, resetScan } from '../store';
import { fixThreat, ignoreThreat, loadIgnored } from '../threat-actions';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const threat = ( id: number, status?: ScanThreat[ 'status' ] ) =>
	( { id, status, title: `Threat ${ id }` } ) as ScanThreat;
const ids = ( list?: { id: number | string }[] ) => list?.map( item => item.id );

/**
 * A promise to settle later, for a read still in flight.
 *
 * @return The promise and its resolve and reject.
 */
function deferred() {
	let resolve: ( value: unknown ) => void = () => {};
	let reject: ( reason: unknown ) => void = () => {};
	const promise = new Promise( ( done, fail ) => {
		resolve = done;
		reject = fail;
	} );
	return { promise, resolve, reject };
}

/**
 * Hold requests to one path until the test settles them; others succeed right away.
 *
 * @param path   - The REST path to hold.
 * @param answer - What other paths answer.
 * @return The held request.
 */
function hold( path: string, answer: unknown = {} ) {
	const held = deferred();
	mockApiFetch.mockImplementation( options =>
		options.path === path ? held.promise : Promise.resolve( answer )
	);
	return held;
}

describe( 'scan store reads', () => {
	afterEach( () => {
		delete window.jetpackProtectDashboard;
		resetScan();
		mockApiFetch.mockReset();
	} );

	it.each( [
		[
			'Scan’s report',
			refreshScan,
			SCAN_PATH,
			{ threats: [ threat( 5 ) ], ignored: [] },
			{ lastChecked: 'new', threats: [ threat( 5 ), threat( 9 ) ] },
			{ threats: [ 9 ], ignored: [ 5 ], lastChecked: 'new' },
		],
		[
			'the ignored list',
			loadIgnored,
			`${ SCAN_PATH }/ignored`,
			{ threats: [ threat( 5 ) ] },
			[ threat( 3, 'ignored' ) ],
			{ threats: [], ignored: [ 5, 3 ], lastChecked: 'old' },
		],
	] )(
		'a read of %s that lands after an ignore keeps both the answer and the ignore',
		async ( _name, read, path, scan, answer, expected ) => {
			window.jetpackProtectDashboard = { scan: { hasPlan: true, lastChecked: 'old', ...scan } };
			const held = hold( path );

			const done = read();
			await ignoreThreat( threat( 5 ) );
			held.resolve( answer );
			await done;

			const result = getScan();
			expect( {
				threats: ids( result?.threats ),
				ignored: ids( result?.ignored ),
				lastChecked: result?.lastChecked,
			} ).toEqual( expected );
		}
	);

	it.each( [
		[
			'answer',
			( held: ReturnType< typeof deferred > ) => held.resolve( { lastChecked: 'older' } ),
		],
		[ 'failure', ( held: ReturnType< typeof deferred > ) => held.reject( new Error( 'Boom' ) ) ],
	] )( 'drops an older read’s %s that lands after a newer answer', async ( _name, settle ) => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, error: false, threats: [] } };
		const first = deferred();
		const second = deferred();
		mockApiFetch.mockReturnValueOnce( first.promise ).mockReturnValueOnce( second.promise );

		const older = refreshScan();
		const newer = refreshScan();
		second.resolve( { lastChecked: 'newer' } );
		await newer;
		settle( first );
		await older;

		expect( getScan() ).toMatchObject( { lastChecked: 'newer', error: false } );
	} );

	it( 'lets an older answer replace a newer read’s failure', async () => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, error: false, threats: [] } };
		const first = deferred();
		const second = deferred();
		mockApiFetch.mockReturnValueOnce( first.promise ).mockReturnValueOnce( second.promise );

		const older = refreshScan();
		const newer = refreshScan();
		second.reject( new Error( 'Boom' ) );
		await newer;
		first.resolve( { lastChecked: 'older', error: false } );
		await older;

		expect( getScan() ).toMatchObject( { lastChecked: 'older', error: false } );
	} );

	it( 'shows the new count in the menu badge and admin bar after the last threat is ignored', async () => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, threats: [ threat( 5 ) ] } };
		const setCount = jest.fn();
		window.jetpackMenuBadges = { setCount };
		const listener = jest.fn();
		document.addEventListener( 'jetpack-protect-threat-count', listener );
		mockApiFetch.mockResolvedValue( {} );

		await ignoreThreat( threat( 5 ) );
		document.removeEventListener( 'jetpack-protect-threat-count', listener );
		delete window.jetpackMenuBadges;

		expect( setCount ).toHaveBeenCalledWith( 'jetpack-protect', 0 );
		expect( listener ).toHaveBeenCalledTimes( 1 );
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual( { count: 0 } );
		expect( window.jetpackProtectThreatCount ).toBe( 0 );
	} );

	it( 'keeps an ignore made while a fix runs', async () => {
		window.jetpackProtectDashboard = {
			scan: { hasPlan: true, threats: [ threat( 5 ), threat( 7 ) ] },
		};
		const held = hold( `${ SCAN_PATH }/threats/5/fix` );

		const done = fixThreat( threat( 5 ) );
		await ignoreThreat( threat( 7 ) );
		held.resolve( { status: 'fixed', scan: { threats: [ threat( 7 ) ] } } );
		await done;

		expect( ids( getScan()?.threats ) ).toEqual( [] );
		expect( ids( getScan()?.ignored ) ).toEqual( [ 7 ] );
	} );

	it( 'keeps a fix when a read that started before it lands afterward', async () => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, threats: [ threat( 5 ) ] } };
		const held = hold( SCAN_PATH, { status: 'fixed', scan: { lastChecked: 'fix', threats: [] } } );

		const done = refreshScan();
		await fixThreat( threat( 5 ) );
		held.resolve( { lastChecked: 'stale', threats: [ threat( 5 ) ] } );
		await done;

		expect( getScan() ).toMatchObject( { lastChecked: 'fix', threats: [] } );
	} );
} );
