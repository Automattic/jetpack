import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store } from './store';
import type { Services, Settings, Status } from '../types';

/**
 * Which variant each section renders.
 *
 * @return Status, once known.
 */
export function useStatus(): Status | undefined {
	return useSelect( select => select( store ).getStatus(), [] );
}

/**
 * Every setting the screen shows on this site.
 *
 * @return Settings, once known.
 */
export function useSettings(): Settings | undefined {
	return useSelect( select => select( store ).getSettings(), [] );
}

/**
 * The enabled services. The route answers 409 unless the Sharing section configures.
 *
 * @param enabled - Whether to fetch.
 * @return The services, and whether the first read is still to come.
 */
export function useServices( enabled: boolean ): {
	data: Services | undefined;
	isPending: boolean;
} {
	const registry = useRegistry();
	// A list that could not be loaded tries again when it next appears.
	useEffect( () => {
		if ( enabled && registry.select( store ).hasReadFailed( 'services' ) ) {
			registry.dispatch( store ).reread( 'services' );
		}
	}, [ enabled, registry ] );

	return useSelect(
		select => {
			if ( ! enabled ) {
				return { data: undefined, isPending: true };
			}
			const data = select( store ).getServices();
			return { data, isPending: ! data && ! select( store ).hasReadFailed( 'services' ) };
		},
		[ enabled ]
	);
}

/**
 * Whether any write is queued or in flight.
 *
 * @return Whether something is saving.
 */
export function useIsSaving(): boolean {
	return useSelect( select => select( store ).getPendingWrites() > 0, [] );
}
