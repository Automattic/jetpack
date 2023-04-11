// eslint-disable-next-line import/no-unresolved
import { SyncedStoreInterface } from '@automattic/jetpack-svelte-data-sync-client/build/types';
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

export const modulesState = modulesStateClient.store;

export const reloadModulesState = async () => {
	const result = await modulesStateClient.endpoint.GET();
	modulesStateClient.store.override( result );
	return result;
};

export const isModuleAvailableStore = ( slug: string ) =>
	derived( modulesState, $modulesState => $modulesState[ slug ].available );

export async function updateModuleState( slug: string, active: boolean ) {
	const result = await modulesStateClient.endpoint.MERGE( {
		[ slug ]: { active },
	} );
	modulesStateClient.store.override( result );
	return result;
}

export const isModuleEnabledStore = ( slug: string ) =>
	derived(
		modulesState,
		$modulesState => $modulesState[ slug ].available && $modulesState[ slug ].active
	);
