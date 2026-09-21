import { queueActivationRequest } from '../queue-activation-request';

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

	it( 'gives up on a request that never settles, so the queue keeps moving', async () => {
		jest.useFakeTimers();

		const stuck = queueActivationRequest( () => new Promise< string >( () => undefined ) );
		const after = queueActivationRequest( () => Promise.resolve( 'after' ) );

		// Caught before the clock moves, or the rejection lands with no handler attached.
		const stuckSettled = stuck.catch( ( error: Error ) => error );

		await jest.advanceTimersByTimeAsync( 90_000 );

		const settled = await stuckSettled;

		expect( settled ).toBeInstanceOf( Error );
		expect( ( settled as Error ).message ).toContain( 'took too long' );
		await expect( after ).resolves.toBe( 'after' );

		jest.useRealTimers();
	} );
} );
