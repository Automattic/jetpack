import { useCallback } from 'react';
import { SupportedService } from './types';
import { useSupportedServices } from './use-supported-services';

export interface GetService {
	/**
	 * @param {string} service_name - The name of the service.
	 */
	( service_name: string ): SupportedService;
}

/**
 * Returns the service object for a service name.
 *
 * @return - The service object.
 */
export function useService() {
	const supportedServices = useSupportedServices();

	return useCallback< GetService >(
		service_name => {
			return supportedServices.find( service => service.id === service_name );
		},
		[ supportedServices ]
	);
}
