import { z } from 'zod';
import { createAsyncFactory } from '../../packages/Async_Option/scripts/factory';

const Jetpack_Inspect_Options = z.object( {
	rest_api: z.object( {
		value: z.string().url(),
		nonce: z.string(),
	} ),
	monitor_status: z.object( {
		value: z.boolean(),
		nonce: z.string(),
	} ),
	observer_incoming: z.object( {
		value: z.object( {
			enabled: z.boolean(),
			filter: z.string(),
		} ),
		nonce: z.string(),
	} ),
	observer_outgoing: z.object( {
		value: z.object( {
			enabled: z.boolean(),
			filter: z.string(),
		} ),
		nonce: z.string(),
	} ),
} );

const async = createAsyncFactory( 'jetpack_inspect', Jetpack_Inspect_Options );

export const options = {
	monitorStatus: async.createStore( 'monitor_status' ),
	observerIncoming: async.createStore( 'observer_incoming' ),
	observerOutgoing: async.createStore( 'observer_outgoing' ),
};

export const API = async.api;
