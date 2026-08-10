/**
 * Tests for the Likes queue handler <-> master iframe readiness handshake.
 */

describe( 'Likes queue handler master iframe handshake', () => {
	let masterWindow;
	// Listeners the queue handler attaches to window on each require(). jest.resetModules() clears
	// the module cache but leaves these attached, so we track and detach them between tests to stop
	// a stale masterReady handler from firing against the current test's DOM.
	let trackedWindowListeners;

	// Collect only the `queryMasterReady` pings the queue handler posts to the master iframe.
	const queryReadyPings = () =>
		masterWindow.postMessage.mock.calls.filter( ( [ raw ] ) => {
			try {
				return JSON.parse( raw ).data.event === 'queryMasterReady';
			} catch {
				return false;
			}
		} );

	// Collect the `initialBatch` requests the queue handler posts once it starts processing widgets.
	const initialBatches = () =>
		masterWindow.postMessage.mock.calls.filter( ( [ raw ] ) => {
			try {
				return JSON.parse( raw ).data.event === 'initialBatch';
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

	// Simulate a master iframe that answers a `queryMasterReady` ping by (re-)emitting `masterReady`.
	// This is the crux of the fix: a real master that missed nothing stays silent forever, so the
	// queue only recovers because the ping prompts this reply. If the ping is removed, this master
	// never speaks and the readiness-dependent assertions below fail.
	const answerPingsWithMasterReady = () =>
		masterWindow.postMessage.mockImplementation( raw => {
			let event;
			try {
				event = JSON.parse( raw ).data.event;
			} catch {
				return;
			}
			if ( event === 'queryMasterReady' ) {
				sendMasterReady();
			}
		} );

	// Add an unloaded post-like widget so the queue has something to process once the master is ready.
	const addUnloadedPostWidget = () => {
		const widget = document.createElement( 'div' );
		widget.id = 'like-post-wrapper-12345-678-abc123';
		widget.className = 'jetpack-likes-widget-unloaded';
		widget.dataset.src = 'https://widgets.wp.com/likes/#blog_id=12345&post_id=678';
		widget.dataset.name = 'like-post-frame-12345-678-abc123';
		widget.dataset.title = 'Like or Reblog';

		const placeholder = document.createElement( 'div' );
		placeholder.className = 'likes-widget-placeholder post-likes-widget-placeholder';
		widget.appendChild( placeholder );

		document.body.appendChild( widget );
	};

	beforeEach( () => {
		jest.useFakeTimers();
		jest.resetModules();

		document.body.innerHTML = '';

		// Record every window listener the queue handler adds so afterEach can detach them.
		trackedWindowListeners = [];
		const addEventListener = window.addEventListener.bind( window );
		jest.spyOn( window, 'addEventListener' ).mockImplementation( ( type, listener, options ) => {
			trackedWindowListeners.push( { type, listener, options } );
			addEventListener( type, listener, options );
		} );

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

		trackedWindowListeners.forEach( ( { type, listener, options } ) =>
			window.removeEventListener( type, listener, options )
		);
		jest.restoreAllMocks();
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

		// It pings while it waits for readiness...
		expect( queryReadyPings().length ).toBeGreaterThanOrEqual( 1 );

		sendMasterReady();
		// masterReady is handled after the internal document-ready promise resolves.
		await Promise.resolve();

		// ...and stops pinging once the master is ready, even as the poll keeps ticking.
		const pingsWhenReady = queryReadyPings().length;
		jest.advanceTimersByTime( 2000 );
		expect( queryReadyPings() ).toHaveLength( pingsWhenReady );
	} );

	it( 'recovers a missed masterReady: the ping prompts the master to re-emit, and the queue starts', async () => {
		addUnloadedPostWidget();
		answerPingsWithMasterReady();

		// Loading the script pings the master, which (only because of the ping) answers with
		// masterReady; that reply is handled after the internal document-ready promise resolves.
		require( '../queuehandler' );
		await Promise.resolve();

		// Recovery worked: the queue picked up the waiting widget and requested its data.
		expect( initialBatches().length ).toBeGreaterThanOrEqual( 1 );
	} );
} );
