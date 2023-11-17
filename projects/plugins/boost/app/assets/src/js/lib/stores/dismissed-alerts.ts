import { SyncedStoreCallback } from '@automattic/jetpack-svelte-data-sync-client';
import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

const dismissedAlertsSchema = z.record( z.string().min( 1 ), z.boolean() );

export const dismissedAlertsClient = jetpack_boost_ds.createAsyncStore(
	'dismissed_alerts',
	dismissedAlertsSchema
);

type MapType = z.infer< typeof dismissedAlertsSchema >;

/**
 * This function creates an SyncedStoreCallback.
 * It's wrapped in a function so that pendingValues can be scoped to this function.
 */
function createDismissedAlertSyncAction() {
	// Keep track of the pending values
	const pendingValues = new Map< string, boolean >();

	const action: SyncedStoreCallback< MapType > = async ( prevValue, newValue, abortSignal ) => {
		// Extract the keys that have changed
		const changedKeys = Object.keys( newValue ).filter(
			key => prevValue[ key ] !== newValue[ key ]
		);

		// Update the pending values that have changed
		for ( const key of changedKeys ) {
			pendingValues.set( key, newValue[ key ] );
		}

		// Reconstruct an object with only the changed keys
		const updatedValue = Object.fromEntries( pendingValues.entries() );

		// Attempt to merge the pending values
		const result = await dismissedAlertsClient.endpoint.MERGE( updatedValue, abortSignal );

		// If the request is aborted,
		// MERGE is going to throw an error that is caught by SyncedStore
		// Which means that if we get this far, the request was successful
		// so we can clear the pending values
		pendingValues.clear();
		return result;
	};

	return action;
}

dismissedAlertsClient.setSyncAction( createDismissedAlertSyncAction() );

export const dismissedAlerts = dismissedAlertsClient.store;
