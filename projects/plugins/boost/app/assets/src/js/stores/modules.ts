import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';
import type { SyncedStoreCallback } from '@automattic/jetpack-svelte-data-sync-client';

export type Optimizations = {
	[ slug: string ]: boolean;
};

const modulesStateSchema = z.record(
	z.string().min( 1 ),
	z.object( {
		active: z.boolean(),
		available: z.boolean(),
	} )
);

type ModulesState = z.infer< typeof modulesStateSchema >;
const modulesStateClient = jetpack_boost_ds.createAsyncStore( 'modules_state', modulesStateSchema );

/**
 * This function creates an SyncedStoreCallback.
 * It's wrapped in a function so that pendingValues can be scoped to this function.
 */
function createModulesSyncAction() {
	// Keep track of the pending values
	const pendingValues = new Map< string, ModulesState[ string ] >();

	const action: SyncedStoreCallback< ModulesState > = async (
		prevValue,
		newValue,
		abortSignal
	) => {
		// Extract the keys that have changed
		const changedKeys = Object.keys( newValue ).filter(
			key => prevValue[ key ].active !== newValue[ key ].active
		);

		// Update the pending values that have changed
		for ( const key of changedKeys ) {
			pendingValues.set( key, newValue[ key ] );
		}

		// Reconstruct an object with only the changed keys
		const updatedValue = Object.fromEntries( pendingValues.entries() );

		// Attempt to merge the pending values
		const result = await modulesStateClient.endpoint.MERGE( updatedValue, abortSignal );

		// If the request is aborted,
		// MERGE is going to throw an error that is caught by SyncedStore
		// Which means that if we get this far, the request was successful
		// so we can clear the pending values
		pendingValues.clear();
		return result;
	};

	return action;
}

modulesStateClient.setSyncAction( createModulesSyncAction() );

export const reloadModulesState = async () => {
	const result = await modulesStateClient.endpoint.GET();
	modulesStateClient.store.override( result );
	return result;
};

export const modulesState = modulesStateClient.store;
export const modulesStatePending = modulesStateClient.pending;
