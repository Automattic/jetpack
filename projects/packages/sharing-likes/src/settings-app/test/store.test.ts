import { act } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { store } from '../data/store';
import { baseSettings, createTestRegistry } from './helpers';
import type { Services } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

/**
 * A promise and the functions that settle it.
 *
 * @return Deferred.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

beforeEach( () => {
	mockApiFetch.mockReset();
} );

describe( 'store reads', () => {
	it( 'drops a reread that lands after a local change made right after it was asked for', async () => {
		const read = deferred< unknown >();
		mockApiFetch.mockImplementation( () => read.promise );
		const registry = createTestRegistry();

		const reread = registry.dispatch( store ).reread( 'settings' );
		registry.dispatch( store ).receive( 'settings', { ...baseSettings, button_style: 'icon' } );
		await act( async () => {
			read.resolve( baseSettings );
			await reread;
		} );

		expect( registry.select( store ).getSettings()?.button_style ).toBe( 'icon' );
	} );

	it( 'keeps the latest services read failing when an earlier read lands after it', async () => {
		const first = deferred< Services >();
		const second = deferred< Services >();
		let reads = 0;
		mockApiFetch.mockImplementation( () => {
			reads += 1;
			return reads === 1 ? first.promise : second.promise;
		} );
		const registry = createTestRegistry();

		await act( async () => {
			registry.select( store ).getServices();
			// Resolvers start on the next tick.
			await new Promise( resolve => setTimeout( resolve ) );
		} );
		const reread = registry.dispatch( store ).reread( 'services' );
		await act( async () => {
			second.reject( { message: 'Gone.' } );
			await reread;
			first.resolve( { visible: [ 'x' ], hidden: [], services: [] } );
		} );

		expect( reads ).toBe( 2 );
		expect( registry.select( store ).getServices() ).toBeUndefined();
		expect( registry.select( store ).hasReadFailed( 'services' ) ).toBe( true );
	} );
} );
