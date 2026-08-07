/**
 * Tests for the Likes queue handler <-> master iframe readiness handshake.
 *
 * @jest-environment jsdom
 */

describe( 'Likes queue handler master iframe handshake', () => {
	let masterWindow;

	// Collect only the `queryMasterReady` pings the queue handler posts to the master iframe.
	const queryReadyPings = () =>
		masterWindow.postMessage.mock.calls.filter( ( [ raw ] ) => {
			try {
				return JSON.parse( raw ).data.event === 'queryMasterReady';
			} catch {
				return false;
			}
		} );

	const sendMasterReady = () =>
		window.dispatchEvent(
			new MessageEvent( 'message', {
				data: JSON.stringify( {
					type: 'likesMessage',
					data: { event: 'masterReady' },
				} ),
				origin: 'https://widgets.wp.com',
			} )
		);

	beforeEach( () => {
		jest.useFakeTimers();
		jest.resetModules();

		document.body.innerHTML = '';

		// The queue handler talks to the master iframe via window.frames['likes-master'].
		const iframe = document.createElement( 'iframe' );
		iframe.id = 'likes-master';
		iframe.name = 'likes-master';
		document.body.appendChild( iframe );

		masterWindow = window.frames[ 'likes-master' ];
		jest.spyOn( masterWindow, 'postMessage' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'pings the master iframe with queryMasterReady while it waits for readiness', () => {
		// Loading the script runs the queue handler once; the master hasn't reported ready yet.
		require( '../queuehandler' );

		expect( queryReadyPings().length ).toBeGreaterThanOrEqual( 1 );

		// The poll keeps pinging on each tick, so a missed masterReady eventually gets answered.
		const before = queryReadyPings().length;
		jest.advanceTimersByTime( 500 );
		expect( queryReadyPings().length ).toBeGreaterThan( before );
	} );

	it( 'stops pinging once the master iframe reports it is ready', async () => {
		require( '../queuehandler' );

		sendMasterReady();
		// masterReady is handled after the internal document-ready promise resolves.
		await Promise.resolve();

		masterWindow.postMessage.mockClear();
		jest.advanceTimersByTime( 2000 );

		expect( queryReadyPings() ).toHaveLength( 0 );
	} );
} );
