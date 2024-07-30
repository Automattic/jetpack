import { useCallback } from 'react';
import { SupportedService, useSupportedServices } from './use-supported-services';

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
	const supportedServices = useSupportedServices();

	const servicesMap = supportedServices.reduce< Record< string, SupportedService > >(
		( acc, service ) => {
			acc[ service.ID ] = service;
			return acc;
		},
		{}
	);

	return useCallback< GetServiceLabel >(
		service_name => {
			const serviceLabel =
				// For Jetpack sites, we should have the service in the map
				// But for WPCOM sites, we might not have the service in the map yet
				servicesMap[ service_name ]?.label ||
				// So we capitalize the service name
				service_name[ 0 ].toUpperCase() + service_name.substring( 1 );

			return serviceLabel;
		},
		[ servicesMap ]
	);
}
