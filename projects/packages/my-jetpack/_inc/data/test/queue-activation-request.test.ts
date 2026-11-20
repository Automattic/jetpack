import { holdActivationQueue, queueActivationRequest } from '../queue-activation-request';

const flush = () => new Promise( resolve => setTimeout( resolve, 0 ) );

describe( 'queueActivationRequest', () => {
	it( 'starts a request only once the one before it has settled', async () => {
		const order: string[] = [];
		let releaseFirst: () => void = () => undefined;

		const first = queueActivationRequest( () => {
			order.push( 'first:start' );
			return new Promise< string >( resolve => {
				releaseFirst = () => {
					order.push( 'first:end' );
					resolve( 'first' );
				};
			} );
		} );

		const second = queueActivationRequest( () => {
			order.push( 'second:start' );
			return Promise.resolve( 'second' );
		} );

		// Every request is chained off a promise, so even the first starts on a microtask.
		await flush();

		expect( order ).toEqual( [ 'first:start' ] );

		releaseFirst();
		await Promise.all( [ first, second ] );

		expect( order ).toEqual( [ 'first:start', 'first:end', 'second:start' ] );
	} );

	it( 'runs the next request after one rejects, and reports the rejection to its caller', async () => {
		const failing = queueActivationRequest( () => Promise.reject( new Error( 'nope' ) ) );

		await expect( failing ).rejects.toThrow( 'nope' );

		await expect( queueActivationRequest( () => Promise.resolve( 'after' ) ) ).resolves.toBe(
			'after'
		);
	} );

	it( 'tells the caller when a request has not answered, without starting the next one', async () => {
		jest.useFakeTimers();

		let release: ( value: string ) => void = () => undefined;
		let secondStarted = false;

		const stuck = queueActivationRequest( () => new Promise< string >( r => ( release = r ) ) );
		const after = queueActivationRequest( () => {
			secondStarted = true;
			return Promise.resolve( 'after' );
		} );

		// Both handlers attached before the clock moves, or the rejections land unhandled.
		const settled = stuck.catch( ( error: Error ) => error );
		const afterSettled = after.catch( ( error: Error ) => error );

		await jest.advanceTimersByTimeAsync( 90_000 );

		expect( ( ( await settled ) as Error ).message ).toContain( 'took too long' );

		// Giving up waiting does not stop the server writing, so the next request waits.
		expect( secondStarted ).toBe( false );

		// The second caller was told too, so its request is dropped rather than applied
		// late against a switch that has already gone back.
		release( 'done' );
		await jest.advanceTimersByTimeAsync( 0 );

		expect( ( ( await afterSettled ) as Error ).message ).toContain( 'took too long' );
		expect( secondStarted ).toBe( false );

		jest.useRealTimers();
	} );
} );

describe( 'holdActivationQueue', () => {
	it( 'starts at once, and holds requests queued even before it until it settles', async () => {
		const order: string[] = [];
		let releaseQueued: () => void = () => undefined;
		let releaseHold: () => void = () => undefined;

		const queued = queueActivationRequest(
			() => new Promise< void >( resolve => ( releaseQueued = resolve ) )
		);
		const after = queueActivationRequest( () => {
			order.push( 'after:start' );
			return Promise.resolve();
		} );

		await flush();

		const held = holdActivationQueue( () => {
			order.push( 'hold:start' );
			return new Promise< void >( resolve => ( releaseHold = resolve ) );
		} );

		// Starts while the request ahead of it is still out.
		expect( order ).toEqual( [ 'hold:start' ] );

		releaseQueued();
		await queued;
		await flush();

		expect( order ).toEqual( [ 'hold:start' ] );

		releaseHold();
		await Promise.all( [ held, after ] );

		expect( order ).toEqual( [ 'hold:start', 'after:start' ] );
	} );
} );
