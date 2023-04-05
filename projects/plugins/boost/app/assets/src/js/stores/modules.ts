// eslint-disable-next-line import/no-unresolved
import { SyncedStoreInterface } from '@automattic/jetpack-svelte-data-sync-client/build/types';
import { updatedDiff } from 'deep-object-diff';
import { derived } from 'svelte/store';
import { z } from 'zod';
import { client } from './data-sync-client';

export type Optimizations = {
	[ slug: string ]: boolean;
};

export type ModulesState = SyncedStoreInterface< boolean >;

export const modulesStateClient = client.createAsyncStore(
	'modules_state',
	z.record(
		z.string().min( 1 ),
		z.object( {
			active: z.boolean(),
			available: z.boolean(),
		} )
	)
);
modulesStateClient.setSyncAction( ( prevValue, newValue, abortController ) => {
	const diff = updatedDiff( prevValue, newValue );
	return modulesStateClient.endpoint.MERGE( diff, abortController );
} );

export const modulesState = modulesStateClient.store;

export const reloadModulesState = async () => {
	// @todo Implement a real API call.
	await new Promise( resolve => setTimeout( resolve, 1000 ) );
};

export const isModuleAvailableStore = ( slug: string ) =>
	derived( modulesState, $modulesState => $modulesState[ slug ].available );

export async function updateModuleState( slug: string, value: boolean ) {
	modulesState.update( $modulesState => {
		$modulesState[ slug ].active = value;
		return $modulesState;
	} );
}

export const isModuleEnabledStore = ( slug: string ) =>
	derived(
		modulesState,
		$modulesState => $modulesState[ slug ].available && $modulesState[ slug ].active
	);
