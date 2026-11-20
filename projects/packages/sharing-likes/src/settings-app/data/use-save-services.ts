import { useDispatch } from '@wordpress/data';
import { store } from './store';
import type { SaveServicesOptions, ServiceLists } from './writes';
import type { Services } from '../types';

export type { ServiceLists };

type SaveServices = (
	lists: ServiceLists,
	options?: SaveServicesOptions
) => Promise< Services | undefined >;

/**
 * Save the enabled services optimistically, rolling back if the server refuses.
 *
 * @return Save function, resolving to the saved services or undefined on failure.
 */
export function useSaveServices(): SaveServices {
	return useDispatch( store ).saveServices as SaveServices;
}
