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
} );
