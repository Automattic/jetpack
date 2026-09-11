/**
 * Tests for the Likes queue handler <-> master iframe readiness handshake.
 */

describe( 'Likes queue handler master iframe handshake', () => {
	let masterWindow;
	// Listeners the queue handler attaches to window on each require(). jest.resetModules() clears
	// the module cache but leaves these attached, so we track and detach them between tests to stop
	// a stale masterReady handler from firing against the current test's DOM.
	let trackedWindowListeners;
	// The callback and observed elements of the IntersectionObserver the queue handler builds.
	// jsdom has no IntersectionObserver, so tests that want one install the fake below.
	let observerCallback;
	let observedElements;

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

		return widget;
	};

	const installIntersectionObserver = () => {
		window.IntersectionObserver = function ( callback ) {
			observerCallback = callback;
			this.observe = element => observedElements.push( element );
			this.unobserve = () => {};
			this.disconnect = () => {};
		};
	};

	// jsdom gives every element a zero rect, which counts as in view. Place a widget explicitly.
	const placeWidgetAt = ( widget, top ) => {
		widget.getBoundingClientRect = () => ( { top, bottom: top + 55 } );
	};

	// Comment widgets are the ones that get unloaded again when they scroll out of view. The
	// iframe lands after .comment-like-feedback, two levels below the wrapper, and the unload
	// path walks back up from it — so the nesting here has to match modules/comment-likes.php.
	const addUnloadedCommentWidget = () => {
		const widget = document.createElement( 'div' );
		widget.id = 'like-comment-wrapper-12345-99-abc123';
		widget.className = 'jetpack-comment-likes-widget-wrapper jetpack-likes-widget-unloaded';
		widget.dataset.src = 'https://widgets.wp.com/likes/#blog_id=12345&comment_id=99';
		widget.dataset.name = 'like-comment-frame-12345-99-abc123';

		const placeholder = document.createElement( 'div' );
		placeholder.className = 'likes-widget-placeholder comment-likes-widget-placeholder';
		widget.appendChild( placeholder );

		const inner = document.createElement( 'div' );
		inner.className = 'comment-likes-widget jetpack-likes-widget';
		const feedback = document.createElement( 'span' );
		feedback.className = 'comment-like-feedback';
		inner.appendChild( feedback );
		widget.appendChild( inner );

		document.body.appendChild( widget );

		return widget;
	};

	// Drive the queue to the point where it has created the widget's iframe.
	const startQueue = async () => {
		answerPingsWithMasterReady();
		require( '../queuehandler' );
		await Promise.resolve();
		jest.advanceTimersByTime( 500 );
	};

	// ...and fire the load event jsdom never fires for a cross-origin src.
	const loadWidget = async widget => {
		await startQueue();
		widget.querySelector( 'iframe' ).dispatchEvent( new Event( 'load' ) );
	};

	// The wrapper has to move as well as its iframe, or the same pass that unloads it finds it
	// in view and reloads it.
	const scrollOutOfView = widget => {
		const outOfView = () => ( { top: 50000, bottom: 50018 } );
		widget.querySelector( 'iframe' ).getBoundingClientRect = outOfView;
		widget.getBoundingClientRect = outOfView;
		window.dispatchEvent( new Event( 'scroll' ) );
		jest.advanceTimersByTime( 250 );
	};

	beforeEach( () => {
		jest.useFakeTimers();
		jest.resetModules();

		document.body.innerHTML = '';
		observerCallback = undefined;
		observedElements = [];

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
		delete window.IntersectionObserver;
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

	it( 'loads a widget a late reflow brings into range, with no scroll event', async () => {
		installIntersectionObserver();
		const widget = addUnloadedPostWidget();
		// At first paint the widget sits far below the fold, so the queue skips it.
		placeWidgetAt( widget, 5000 );
		answerPingsWithMasterReady();

		require( '../queuehandler' );
		await Promise.resolve();
		jest.advanceTimersByTime( 500 );

		expect( initialBatches() ).toHaveLength( 0 );
		expect( observedElements ).toContain( widget );

		// A stylesheet lands and the page reflows: no scroll event, but the widget is now in range.
		placeWidgetAt( widget, 100 );
		observerCallback();
		jest.advanceTimersByTime( 250 );

		expect( initialBatches().length ).toBeGreaterThanOrEqual( 1 );
		expect( widget.querySelector( 'iframe.post-likes-widget' ) ).not.toBeNull();
	} );

	it( 'hides the loading placeholder itself, rather than leaving that to the stylesheet', async () => {
		const widget = addUnloadedPostWidget();
		const placeholder = widget.querySelector( '.likes-widget-placeholder' );

		await loadWidget( widget );

		expect( widget ).toHaveClass( 'jetpack-likes-widget-loaded' );
		expect( placeholder ).not.toBeVisible();
	} );

	it( 'shows the placeholder again when a widget is unloaded', async () => {
		const widget = addUnloadedCommentWidget();
		const placeholder = widget.querySelector( '.likes-widget-placeholder' );

		await loadWidget( widget );
		expect( placeholder ).not.toBeVisible();

		// Its iframe is dropped and the wrapper goes back to unloaded, so the placeholder has to
		// become the visible state again.
		scrollOutOfView( widget );

		expect( widget ).toHaveClass( 'jetpack-likes-widget-unloaded' );
		expect( widget.querySelectorAll( 'iframe' ) ).toHaveLength( 0 );
		expect( placeholder ).toBeVisible();
	} );

	it( 'ignores a load event from an iframe the widget has already dropped', async () => {
		const widget = addUnloadedCommentWidget();
		const placeholder = widget.querySelector( '.likes-widget-placeholder' );

		await startQueue();

		// Scroll away before the iframe reports back, so the queue drops it mid-load.
		const droppedIframe = widget.querySelector( 'iframe' );
		scrollOutOfView( widget );
		droppedIframe.dispatchEvent( new Event( 'load' ) );

		expect( widget ).toHaveClass( 'jetpack-likes-widget-unloaded' );
		expect( placeholder ).toBeVisible();
	} );
} );
