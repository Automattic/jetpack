import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { ConnectionService } from '../../types';

/**
 * Get the list of supported services
 *
 * @param state - State object.
 *
 * @return The list of services.
 */
export const getServicesList = createRegistrySelector( select => () => {
	const data = select( coreStore ).getEntityRecords< ConnectionService >(
		'wpcom/v2',
		'publicize/services'
	);

	return data ?? [];
} );

/**
 * Get the service object for a service.
 *
 * @param state - State object.
 * @param id    - The service ID.
 *
 * @return The service object.
 */
export function getService( state: unknown, id: string ) {
	return getServicesList().find( service => service.id === id );
}

/**
 * Returns whether the services list is being fetched
 */
export const isFetchingServicesList = createRegistrySelector( select => (): boolean => {
	const {
		// @ts-expect-error isResolving does exist but is not typed
		isResolving,
	} = select( coreStore );

	return isResolving( 'getEntityRecords', [ 'wpcom/v2', 'publicize/services' ] );
} );
