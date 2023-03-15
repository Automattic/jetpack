// eslint-disable-next-line import/no-unresolved
import { SyncedStoreInterface } from '@automattic/jetpack-svelte-data-sync-client/build/types';
import { get, derived } from 'svelte/store';
import { z } from 'zod';
import { client } from './data-sync-client';

export type Optimizations = {
	[ slug: string ]: boolean;
};

export type ModulesState = SyncedStoreInterface< boolean >;

export const moduleAvailabilityClient = client.createAsyncStore(
	'available_modules',
	z.record( z.string().min( 1 ), z.boolean() )
);

export const isModuleAvailableStore = ( slug: string ) =>
	derived(
		moduleAvailabilityClient.store,
		$availableModulesClient => $availableModulesClient[ slug ]
	);

export const moduleStates: Record< string, ModulesState > = {};
Object.keys( get( moduleAvailabilityClient.store ) ).forEach( async slug => {
	moduleStates[ slug ] = client.createAsyncStore( `module_status_${ slug }`, z.boolean() );
} );

/**
 * Fetch the current state of the modules from the server.
 */
export async function reloadModulesState() {
	// set( buildModuleState( await api.get( '/optimizations/status' ) ) );
}

export async function updateModuleState( slug: string, value: boolean ) {
	moduleStates[ slug ].store.update( () => value );
	await new Promise( resolve => {
		moduleStates[ slug ].pending.subscribe( pending => {
			if ( ! pending ) {
				resolve( null );
			}
		} );
	} );
}

export const isModuleEnabledStore = ( slug: string ) =>
	derived(
		[ moduleStates[ slug ].store, isModuleAvailableStore( slug ) ],
		( [ $moduleEnabled, $moduleAvailable ] ) => $moduleAvailable && $moduleEnabled
	);
