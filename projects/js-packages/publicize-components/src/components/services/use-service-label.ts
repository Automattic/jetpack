import { useCallback } from 'react';
import { useService } from './use-service';

interface GetServiceLabel {
	/**
	 * @param {string} service_name - The name of the service.
	 */
	( service_name: string ): string;
}

/**
 * Returns the label for a service.
 *
 * @returns {GetServiceLabel} - The service label.
 */
export function useServiceLabel() {
	const getService = useService();

	return useCallback< GetServiceLabel >(
		service_name => {
			const serviceLabel =
				// For Jetpack sites, we should have the service in the map
				// But for WPCOM sites, we might not have the service in the map yet
				getService( service_name )?.label ||
				// So we capitalize the service name
				service_name[ 0 ].toUpperCase() + service_name.substring( 1 );

			return serviceLabel;
		},
		[ getService ]
	);
}
