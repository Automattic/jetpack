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
		...( await import( '../src/stores/facade.ts' ) ),
		...( await import( '../src/stores/GuideState.ts' ) ),
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
		const { guideState, selectors } = await load( persisted );
		expect( selectors.getGuideState() ).toBe( expected );
		expect( localStorage.getItem( LS_KEY ) ).toBe( expected );
		guideState.cycle();
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
	controller.sizeOnPage.set( { width: 101, height: 99 } );
	controller.fileSize.set( { width: 304, height: 298 } );
	controller.fileWeight.set( { weight: 101 } );
	expect( api.selectors.getExpectedSize( controller.id ) ).toEqual( { width: 152, height: 149 } );
	expect( api.selectors.getOversizedRatio( controller.id ) ).toBe( 4 );
	expect( api.selectors.getPotentialSavings( controller.id ) ).toBe( 76 );
	expect( other.getSnapshot().fileSize ).toEqual( { width: 0, height: 0 } );
	controller.fileSize.set( { width: -1, height: -1 } );
	expect( controller.getSnapshot().fileSize ).toEqual( { width: -1, height: -1 } );
} );

it( 'refreshes memoized measurements after a DPR change without dispatch', async () => {
	const api = await load();
	const { controller } = image( api );
	controller.sizeOnPage.set( { width: 100, height: 100 } );
	controller.fileSize.set( { width: 400, height: 400 } );
	controller.fileWeight.set( { weight: 80 } );
	expect( controller.getSnapshot() ).toMatchObject( {
		expectedSize: { width: 100, height: 100 },
		oversizedRatio: 16,
		potentialSavings: 75,
	} );
	controller.oversizedRatio.subscribe( () => {} )();
	const facts = api.selectors.getImageFacts( controller.id );
	Object.defineProperty( window, 'devicePixelRatio', { configurable: true, value: 2 } );
	const ratio = jest.fn();
	controller.oversizedRatio.subscribe( ratio )();
	expect( ratio ).toHaveBeenCalledWith( 4 );
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
	controller.loading.set( false );
	expect( listener ).toHaveBeenCalledTimes( 1 );
	stop();
	controller.loading.set( true );
	expect( listener ).toHaveBeenCalledTimes( 1 );
} );

it( 'notifies immediately, invalidates before updates and unsubscribes idempotently', async () => {
	const api = await load();
	const { guideState, guideLabel } = api;
	const values = [];
	const labels = [];
	const order = [];
	const stop = guideState.subscribe(
		value => {
			values.push( value );
			order.push( 'run' );
		},
		() => order.push( 'invalidate' )
	);
	const stopLabel = guideLabel.subscribe( value => labels.push( value ) );
	guideState.set( 'active' );
	guideState.update( () => 'paused' );
	expect( values ).toEqual( [ 'active', 'paused' ] );
	expect( labels ).toEqual( [ 'Active', 'Paused' ] );
	expect( order ).toEqual( [ 'run', 'invalidate', 'run' ] );
	stop();
	stop();
	stopLabel();
	guideState.cycle();
	expect( values ).toEqual( [ 'active', 'paused' ] );
	const { controller } = image( api );
	const dimensions = { width: 200, height: 100 };
	const notifications = jest.fn();
	const widths = [];
	const stopExpected = controller.expectedSize.subscribe( value => widths.push( value.width ) );
	const stopSize = controller.sizeOnPage.subscribe( notifications );
	controller.sizeOnPage.set( dimensions );
	controller.sizeOnPage.update( value => {
		value.width = 300;
		return value;
	} );
	expect( notifications ).toHaveBeenCalledTimes( 3 );
	expect( controller.getSnapshot().expectedSize.width ).toBe( 300 );
	expect( widths ).toEqual( [ 0, 200, 300 ] );
	stopSize();
	stopExpected();
} );

it( 'restarts weight fetching after double unsubscribe and the last savings unsubscriber', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	await controller.updateDimensions();
	const first = controller.fileWeight.subscribe( () => {} );
	const second = controller.fileWeight.subscribe( () => {} );
	await Promise.resolve();
	first();
	first();
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	const third = controller.fileWeight.subscribe( () => {} );
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	second();
	third();
	const savings = controller.potentialSavings.subscribe( () => {} );
	await Promise.resolve();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	savings();
	source( 'https://example.test/three.png' );
	await controller.updateDimensions();
	const restarted = controller.fileWeight.subscribe( () => {} );
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
		const stops = controllers.flatMap( controller =>
			[ 'fileSize', 'loading', 'oversizedRatio', 'potentialSavings' ].map( key =>
				api.observe(
					() => {
						reads++;
						return controller.getSnapshot()[ key ];
					},
					() => {},
					undefined,
					undefined,
					controller.id
				)
			)
		);
		const factsReads = jest.spyOn( api.selectors, 'getImageFacts' );
		reads = 0;
		await Promise.all( controllers.map( controller => controller.updateDimensions() ) );
		expect( reads ).toBeLessThanOrEqual( count * 16 );
		// Each snapshot reads facts once; the remaining reads count notifyImage routing checks.
		const routingChecks = factsReads.mock.calls.length - reads;
		expect( routingChecks ).toBe( count * 3 );
		routingCounts.push( routingChecks );
		factsReads.mockRestore();
		counts.push( reads );
		stops.forEach( stop => stop() );
	}
	expect( counts[ 1 ] ).toBe( counts[ 0 ] * 10 );
	expect( routingCounts[ 1 ] ).toBe( routingCounts[ 0 ] * 10 );
	const { use } = await import( '@wordpress/data' );
	const registry = use( () => ( {} ) );
	const controllers = [ image( api ).controller, image( api ).controller ];
	const notifications = controllers.map( () => jest.fn() );
	const stops = controllers.map( ( controller, index ) =>
		controller.loading.subscribe( notifications[ index ] )
	);
	registry.batch( () => controllers.forEach( controller => controller.loading.set( false ) ) );
	for ( const notify of notifications )
		expect( notify.mock.calls ).toEqual( [ [ true ], [ false ] ] );
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
	controller.fileWeight.subscribe( () => {} )();
	await outcome;
	await Promise.resolve();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	expect( track ).toHaveBeenCalledTimes( 1 );
	expect( track.mock.calls[ 0 ][ 0 ] ).toBe( 'image_guide_image_outcome' );
	expect( controller.getSnapshot() ).toMatchObject( {
		loading: false,
		fileWeight: { weight: -1 },
	} );
} );

it( 'fetches only on first weight subscription and reuses each URL cache on reactivation', async () => {
	const api = await load();
	const { controller, measurable, source } = image( api );
	await controller.updateDimensions();
	const stopLoading = controller.loading.subscribe( () => {} );
	const stopRatio = controller.oversizedRatio.subscribe( () => {} );
	expect( measurable.getWeight ).not.toHaveBeenCalled();
	const stop = controller.fileWeight.subscribe( () => {} );
	const second = controller.fileWeight.subscribe( () => {} );
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	expect( measurable.getWeight ).toHaveBeenCalledWith( 'https://example.test/one.png' );
	await Promise.resolve();
	expect( controller.getSnapshot() ).toMatchObject( {
		loading: false,
		fileWeight: { weight: 90 },
	} );
	stop();
	second();
	source( 'https://example.test/two.png' );
	await controller.updateDimensions();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 1 );
	const savings = controller.potentialSavings.subscribe( () => {} );
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	await Promise.resolve();
	savings();
	source( 'https://example.test/one.png' );
	await controller.updateDimensions();
	const cached = [];
	const third = controller.fileWeight.subscribe( value => cached.push( value.weight ) );
	expect( cached ).toEqual( [ 90 ] );
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
	third();
	stopLoading();
	stopRatio();
} );

it( 'preserves empty-source activation timing and dimension/weight error sentinels', async () => {
	const api = await load();
	const { controller, measurable } = image( api );
	measurable.getWeight.mockRejectedValueOnce( new Error( 'unavailable' ) );
	const stop = controller.fileWeight.subscribe( () => {} );
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
	const again = controller.fileWeight.subscribe( () => {} );
	await Promise.resolve();
	again();
	expect( measurable.getWeight ).toHaveBeenCalledTimes( 2 );
} );

it( 'keeps analytics names, payloads, severity boundaries and one page-outcome event', async () => {
	const api = await load();
	const track = jest.fn();
	api.Analytics.setTracksCallback( track );
	api.Analytics.trackInitialState();
	api.guideState.cycle();
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
		controller.fileSize.set( { width: ratio * 100, height: 100 } );
		controller.sizeOnPage.set( { width: 100, height: 100 } );
		controller.fileWeight.set( { weight: 90 } );
	}
	const page = api.Analytics.trackPage( controllers );
	expect( track ).not.toHaveBeenCalled();
	controllers.forEach( controller => controller.loading.set( false ) );
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
