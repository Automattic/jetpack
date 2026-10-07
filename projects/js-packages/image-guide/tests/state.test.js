import { jest } from '@jest/globals';
import { MeasurableImage } from '../src/MeasurableImage.ts';

const LS_KEY = 'jetpack-boost-guide';

async function load( persisted = null ) {
	jest.resetModules();
	localStorage.clear();
	if ( persisted !== null ) localStorage.setItem( LS_KEY, persisted );
	const api = await import( '../src/stores/store.ts' );
	return {
		...api,
		...( await import( '../src/stores/MeasurableImageStore.ts' ) ),
		Analytics: ( await import( '../src/analytics.ts' ) ).default,
	};
}

function image( api, initialURL = 'https://example.test/one.png' ) {
	let url = initialURL;
	const node = document.createElement( 'img' );
	const measurable = new MeasurableImage( node, () => url, jest.fn() );
	jest
		.spyOn( measurable, 'getSizeOnPage' )
		.mockImplementation( () => ( { width: 100, height: 100 } ) );
	jest
		.spyOn( measurable, 'getFileSize' )
		.mockImplementation( async () => ( { width: 300, height: 300 } ) );
	jest.spyOn( measurable, 'getWeight' ).mockImplementation( async () => 90 );
	return {
		controller: new api.MeasurableImageStore( measurable ),
		measurable,
		source: value => {
			url = value;
		},
	};
}

beforeEach( () => {
	Object.defineProperty( window, 'devicePixelRatio', { configurable: true, value: 1 } );
} );

it.each( [
	[ null, 'active' ],
	[ 'invalid', 'active' ],
	[ 'Active', 'active' ],
	[ 'active', 'active' ],
	[ 'paused', 'paused' ],
] )(
	'persists the accepted guide state %s and cycles it across reload',
	async ( persisted, expected ) => {
		const { commands, selectors } = await load( persisted );
		expect( selectors.getGuideState() ).toBe( expected );
		expect( localStorage.getItem( LS_KEY ) ).toBe( expected );
		commands.cycleGuideState();
		const next = expected === 'active' ? 'paused' : 'active';
		expect( selectors.getGuideLabel() ).toBe( next === 'active' ? 'Active' : 'Paused' );
		expect( ( await load( localStorage.getItem( LS_KEY ) ) ).selectors.getGuideState() ).toBe(
			next
		);
	}
);

it( 'keeps per-image facts separate and delegates DPR, area ratio and savings calculations', async () => {
	const api = await load();
	const { controller } = image( api );
	const other = image( api ).controller;
	expect( controller.getSnapshot() ).toMatchObject( {
		fileSize: { width: 0, height: 0 },
		fileWeight: { weight: -1 },
		sizeOnPage: { width: 0, height: 0 },
		loading: true,
		oversizedRatio: 1,
	} );
	Object.defineProperty( window, 'devicePixelRatio', { configurable: true, value: 1.5 } );
	api.commands.updateImage( controller.id, { sizeOnPage: { width: 101, height: 99 } } );
	api.commands.updateImage( controller.id, { fileSize: { width: 304, height: 298 } } );
	api.commands.updateImage( controller.id, { fileWeight: { weight: 101 } } );
	expect( api.selectors.getExpectedSize( controller.id ) ).toEqual( { width: 152, height: 149 } );
	expect( api.selectors.getOversizedRatio( controller.id ) ).toBe( 4 );
	expect( api.selectors.getPotentialSavings( controller.id ) ).toBe( 76 );
	expect( other.getSnapshot().fileSize ).toEqual( { width: 0, height: 0 } );
	api.commands.updateImage( controller.id, { fileSize: { width: -1, height: -1 } } );
	expect( controller.getSnapshot().fileSize ).toEqual( { width: -1, height: -1 } );
} );

it( 'refreshes memoized measurements after a DPR change without dispatch', async () => {
	const api = await load();
	const { controller } = image( api );
	api.commands.updateImage( controller.id, { sizeOnPage: { width: 100, height: 100 } } );
	api.commands.updateImage( controller.id, { fileSize: { width: 400, height: 400 } } );
	api.commands.updateImage( controller.id, { fileWeight: { weight: 80 } } );
	expect( controller.getSnapshot() ).toMatchObject( {
		expectedSize: { width: 100, height: 100 },
		oversizedRatio: 16,
		potentialSavings: 75,
	} );
	const facts = api.selectors.getImageFacts( controller.id );
	Object.defineProperty( window, 'devicePixelRatio', { configurable: true, value: 2 } );
	expect( controller.getSnapshot() ).toMatchObject( {
		expectedSize: { width: 200, height: 200 },
		oversizedRatio: 4,
		potentialSavings: 60,
	} );
	expect( api.selectors.getImageFacts( controller.id ) ).toBe( facts );
} );

it( 'keeps a recreated image subscription after an old unsubscribe is called twice', async () => {
	const api = await load();
	const { controller } = image( api );
	const old = api.subscribeToFacts( () => {}, controller.id );
	old();
	const listener = jest.fn();
	const stop = api.subscribeToFacts( listener, controller.id );
	old();
	api.commands.updateImage( controller.id, { loading: false } );
	expect( listener ).toHaveBeenCalledTimes( 1 );
	stop();
	api.commands.updateImage( controller.id, { loading: true } );
	expect( listener ).toHaveBeenCalledTimes( 1 );
} );

it( 'notifies guide subscribers only on state changes and unsubscribes idempotently', async () => {
	const { commands, selectors, subscribeToFacts } = await load();
	const values = [];
	const labels = [];
	const stop = subscribeToFacts( () => {
		values.push( selectors.getGuideState() );
		labels.push( selectors.getGuideLabel() );
	} );
	commands.setGuideState( 'active' );
	commands.setGuideState( 'paused' );
	expect( values ).toEqual( [ 'paused' ] );
	expect( labels ).toEqual( [ 'Paused' ] );
	stop();
	stop();
	commands.cycleGuideState();
	expect( values ).toEqual( [ 'paused' ] );
} );

it( 'restarts weight fetching after the last acquire is released idempotently', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	await controller.updateDimensions();
	const first = controller.acquire();
	const second = controller.acquire();
	await Promise.resolve();
	first();
	first();
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	const third = controller.acquire();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	second();
	third();
	const savings = controller.acquire();
	await Promise.resolve();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	savings();
	source( 'https://example.test/three.png' );
	await controller.updateDimensions();
	const restarted = controller.acquire();
	await Promise.resolve();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 3 );
	restarted();
} );

it( 'routes one resize of 500 images with linear selector reads and routing checks', async () => {
	const api = await load();
	const counts = [];
	const routingCounts = [];
	for ( const count of [ 50, 500 ] ) {
		const controllers = Array.from( { length: count }, () => image( api ).controller );
		let reads = 0;
		const stops = controllers.map( controller =>
			api.subscribeToFacts( () => {
				reads++;
				controller.getSnapshot();
			}, controller.id )
		);
		const factsReads = jest.spyOn( api.selectors, 'getImageFacts' );
		reads = 0;
		await Promise.all( controllers.map( controller => controller.updateDimensions() ) );
		expect( reads ).toBeLessThanOrEqual( count * 16 );
		// Each snapshot reads facts once; the remaining reads count notifyImage routing checks.
		const routingChecks = factsReads.mock.calls.length - reads;
		routingCounts.push( routingChecks );
		factsReads.mockRestore();
		counts.push( reads );
		stops.forEach( stop => stop() );
	}
	expect( counts[ 1 ] ).toBe( counts[ 0 ] * 10 );
	expect( routingCounts[ 1 ] ).toBe( routingCounts[ 0 ] * 10 );
} );

it( 'notifies each changed image inside a registry batch', async () => {
	const api = await load();
	const { use } = await import( '@wordpress/data' );
	const registry = use( () => ( {} ) );
	const controllers = [ image( api ).controller, image( api ).controller ];
	const notifications = controllers.map( () => jest.fn() );
	const stops = controllers.map( ( controller, index ) =>
		api.subscribeToFacts( notifications[ index ], controller.id )
	);
	registry.batch( () =>
		controllers.forEach( controller =>
			api.commands.updateImage( controller.id, { loading: false } )
		)
	);
	for ( const notify of notifications ) expect( notify ).toHaveBeenCalledTimes( 1 );
	stops.forEach( stop => stop() );
} );

it( 'emits one image outcome after a rejected weight fetch without analytics retrying', async () => {
	const api = await load();
	const { controller, measurable } = image( api );
	await controller.updateDimensions();
	measurable.getWeight.mockRejectedValue( new Error( 'unavailable' ) );
	const track = jest.fn();
	api.Analytics.setTracksCallback( track );
	const outcome = api.Analytics.trackImageOutcome( controller );
	controller.acquire()();
	await outcome;
	await Promise.resolve();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	for ( let hover = 0; hover < 2; hover++ ) {
		const stop = controller.acquire();
		await Promise.resolve();
		stop();
	}
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 3 );
	expect( track ).toHaveBeenCalledTimes( 1 );
	expect( track.mock.calls[ 0 ][ 0 ] ).toBe( 'image_guide_image_outcome' );
	expect( controller.getSnapshot() ).toMatchObject( {
		loading: false,
		fileWeight: { weight: -1 },
	} );
} );

it( 'fetches only on first acquire and reuses each URL cache on reactivation', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	measurable.getWeight.mockResolvedValueOnce( 90 ).mockResolvedValueOnce( 120 );
	await controller.updateDimensions();
	const stopLoading = api.subscribeToFacts( () => {}, controller.id );
	controller.getSnapshot();
	expect( measurable.getWeight ).not.toHaveBeenCalled();
	const track = jest.fn();
	api.Analytics.setTracksCallback( track );
	const outcome = api.Analytics.trackImageOutcome( controller );
	const stop = controller.acquire();
	const second = controller.acquire();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	expect( measurable.getWeight ).toHaveBeenCalledWith( 'https://example.test/one.png' );
	await outcome;
	expect( track ).toHaveBeenCalledWith(
		'image_guide_image_outcome',
		expect.objectContaining( { potential_savings: 80 } )
	);
	expect( controller.getSnapshot() ).toMatchObject( {
		loading: false,
		fileWeight: { weight: 90 },
	} );
	stop();
	second();
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	const savings = controller.acquire();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	await Promise.resolve();
	expect( controller.getSnapshot().fileWeight.weight ).toBe( 120 );
	savings();
	source( 'https://example.test/one.png' );
	await controller.updateDimensions();
	const third = controller.acquire();
	expect( controller.getSnapshot().fileWeight.weight ).toBe( 90 );
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	third();
	stopLoading();
} );

it( 'preserves empty-source activation timing and dimension/weight error sentinels', async () => {
	const api = await load();
	const { controller, measurable } = image( api );
	measurable.getWeight.mockRejectedValueOnce( new Error( 'unavailable' ) );
	const stop = controller.acquire();
	expect( measurable.getWeight ).toHaveBeenCalledWith( '' );
	await Promise.resolve();
	expect( controller.getSnapshot() ).toMatchObject( {
		loading: false,
		fileWeight: { weight: -1 },
	} );
	stop();
	measurable.getFileSize.mockRejectedValueOnce( new Error( 'unavailable' ) );
	await controller.updateDimensions();
	expect( controller.getSnapshot().fileSize ).toEqual( { width: -1, height: -1 } );
	const again = controller.acquire();
	await Promise.resolve();
	again();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
} );

it( 'keeps analytics names, payloads, severity boundaries and one page-outcome event', async () => {
	const api = await load();
	const track = jest.fn();
	api.Analytics.setTracksCallback( track );
	api.Analytics.trackInitialState();
	api.commands.cycleGuideState();
	api.Analytics.trackUIStateChange();
	expect( track.mock.calls ).toEqual( [
		[ 'image_guide_initial_ui_state', { image_guide_state: 'active' } ],
		[ 'image_guide_ui_state_change', { image_guide_state: 'paused' } ],
	] );
	track.mockClear();
	const controllers = [];
	for ( const ratio of [ 4.01, 4, 2.5 ] ) {
		const { controller } = image( api );
		controllers.push( controller );
		api.commands.updateImage( controller.id, { fileSize: { width: ratio * 100, height: 100 } } );
		api.commands.updateImage( controller.id, { sizeOnPage: { width: 100, height: 100 } } );
		api.commands.updateImage( controller.id, { fileWeight: { weight: 90 } } );
	}
	const page = api.Analytics.trackPage( controllers );
	expect( track ).not.toHaveBeenCalled();
	controllers.forEach( controller =>
		api.commands.updateImage( controller.id, { loading: false } )
	);
	await page;
	await api.Analytics.trackPage( controllers );
	const expected = controllers.map( ( controller, i ) => ( {
		severity: [ 'red', 'yellow', 'green' ][ i ],
		oversized_ratio: [ 4.01, 4, 2.5 ][ i ],
		file_width: [ 401, 400, 250 ][ i ],
		file_height: 100,
		size_on_page_width: 100,
		size_on_page_height: 100,
		expected_width: 100,
		expected_height: 100,
		potential_savings: [ 68, 68, 54 ][ i ],
		image_url: 'https://example.test/one.png',
		window_width: window.innerWidth,
		window_height: window.innerHeight,
		device_pixel_ratio: 1,
	} ) );
	expect( track.mock.calls ).toEqual( [
		...expected.map( props => [ 'image_guide_image_outcome', props ] ),
		[
			'image_guide_page_outcome',
			{
				total_potential_savings: 190,
				red_severity_count: 1,
				yellow_severity_count: 1,
				green_severity_count: 1,
				window_width: window.innerWidth,
				window_height: window.innerHeight,
				device_pixel_ratio: 1,
			},
		],
	] );
} );

it( 'recalculates only from dimensions and weight', async () => {
	const api = await load();
	const { controller } = image( api );
	const other = image( api ).controller;
	api.commands.updateImage( controller.id, {
		fileSize: { width: 400, height: 400 },
		sizeOnPage: { width: 100, height: 100 },
		fileWeight: { weight: 80 },
	} );
	const expectedSize = api.selectors.getExpectedSize( controller.id );
	const { MeasurableImage: Calculator } = await import( '../src/MeasurableImage.ts' );
	const ratio = jest.spyOn( Calculator.prototype, 'getOversizedRatio' );
	const savings = jest.spyOn( Calculator.prototype, 'getPotentialSavings' );
	controller.getSnapshot();
	ratio.mockClear();
	savings.mockClear();
	api.commands.updateImage( controller.id, {
		loading: false,
		url: 'https://example.test/two.png',
	} );
	api.commands.updateImage( other.id, { fileSize: { width: 800, height: 800 } } );
	controller.getSnapshot();
	expect( ratio ).not.toHaveBeenCalled();
	expect( savings ).not.toHaveBeenCalled();
	api.commands.updateImage( controller.id, { fileWeight: { weight: 160 } } );
	expect( api.selectors.getOversizedRatio( controller.id ) ).toBe( 16 );
	expect( ratio ).not.toHaveBeenCalled();
	expect( api.selectors.getPotentialSavings( controller.id ) ).toBe( 150 );
	expect( savings ).toHaveBeenCalledTimes( 1 );
	api.commands.updateImage( controller.id, { fileSize: { width: 200, height: 200 } } );
	expect( controller.getSnapshot() ).toMatchObject( { oversizedRatio: 4, potentialSavings: 120 } );
	expect( api.selectors.getExpectedSize( controller.id ) ).toBe( expectedSize );
	api.commands.updateImage( controller.id, { sizeOnPage: { width: 200, height: 200 } } );
	expect( controller.getSnapshot() ).toMatchObject( {
		expectedSize: { width: 200, height: 200 },
		oversizedRatio: 1,
		potentialSavings: null,
	} );
	ratio.mockRestore();
	savings.mockRestore();
} );

it( 'shares a pending weight fetch and publishes completion after all consumers release', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	await controller.updateDimensions();
	const initial = controller.acquire();
	await Promise.resolve();
	initial();
	expect( controller.getSnapshot().loading ).toBe( false );
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	let finish;
	measurable.getWeight.mockImplementation( () => new Promise( resolve => ( finish = resolve ) ) );
	const states = [];
	const stop = api.subscribeToFacts( () => states.push( controller.getSnapshot() ), controller.id );
	const first = controller.acquire();
	const second = controller.acquire();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	expect( controller.getSnapshot().loading ).toBe( true );
	first();
	second();
	finish( 90 );
	await Promise.resolve();
	expect( states.at( -1 ) ).toMatchObject( { loading: false, fileWeight: { weight: 90 } } );
	controller.acquire()();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	stop();
} );

it.each( [ 0, -1 ] )( 'caches a resolved weight of %s per URL', async weight => {
	const api = await load();
	const { controller, measurable } = image( api );
	await controller.updateDimensions();
	measurable.getWeight.mockResolvedValue( weight );
	const release = controller.acquire();
	await Promise.resolve();
	release();
	controller.acquire()();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	expect( controller.getSnapshot() ).toMatchObject( { loading: false, fileWeight: { weight } } );
} );

it( 'updates displayed dimensions without refetching an unchanged source', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	await controller.updateDimensions();
	measurable.getSizeOnPage.mockReturnValue( { width: 200, height: 150 } );
	await controller.updateDimensions();
	expect( measurable.getFileSize ).toHaveBeenCalledTimes( 1 );
	expect( controller.getSnapshot().sizeOnPage ).toEqual( { width: 200, height: 150 } );
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	expect( measurable.getFileSize ).toHaveBeenCalledTimes( 2 );
	expect( measurable.getFileSize ).toHaveBeenLastCalledWith( 'https://example.test/two.png' );
	expect( controller.getSnapshot().url ).toBe( 'https://example.test/two.png' );
	expect( measurable.getWeight ).not.toHaveBeenCalled();
} );
