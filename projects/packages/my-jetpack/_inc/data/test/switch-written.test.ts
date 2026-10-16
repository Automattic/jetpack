import apiFetch from '@wordpress/api-fetch';
import { onSwitchWritten } from '../switch-written';

describe( 'onSwitchWritten', () => {
	const listener = jest.fn();

	beforeAll( () => {
		apiFetch.setFetchHandler( () => Promise.resolve( {} ) );
		onSwitchWritten( listener );
	} );

	beforeEach( () => listener.mockClear() );

	it.each( [
		'/jetpack/v4/module/stats/active',
		'/wpcom/v2/my-jetpack/site/features/plugin',
		'/wpcom/v2/my-jetpack/site/features/bulk',
	] )( 'fires once %s has been written', async path => {
		await apiFetch( { path, method: 'POST' } );

		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps notifying once a listener throws', async () => {
		const after = jest.fn();
		const stopThrowing = onSwitchWritten( () => {
			throw new Error( 'nope' );
		} );
		const stopAfter = onSwitchWritten( after );

		await apiFetch( { path: '/jetpack/v4/module/stats/active', method: 'POST' } );

		expect( after ).toHaveBeenCalledTimes( 1 );

		stopThrowing();
		stopAfter();
	} );

	it( 'ignores other routes', async () => {
		await apiFetch( { path: '/jetpack/v4/module/all' } );
		await apiFetch( { path: '/wpcom/v2/my-jetpack/site/features' } );
		await apiFetch( { path: '/jetpack/v4/settings', method: 'POST' } );

		expect( listener ).not.toHaveBeenCalled();
	} );
} );
