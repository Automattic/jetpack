import { useCallback, useMemo } from 'react';
import { SupportedService, useSupportedServices } from './use-supported-services';

export interface GetService {
	/**
	 * @param {string} service_name - The name of the service.
	 */
	( service_name: string ): SupportedService;
}

export type SupportedServicesMap = Record< string, SupportedService >;

/**
 * Returns the service object for a service name.
 *
 * @return {GetService} - The service object.
 */
export function useService() {
	const supportedServices = useSupportedServices();

	const servicesMap = useMemo( () => {
		return supportedServices.reduce< SupportedServicesMap >( ( acc, service ) => {
			acc[ service.id ] = service;
			return acc;
		}, {} );
	}, [ supportedServices ] );

	return useCallback< GetService >(
		service_name => {
			return servicesMap[ service_name ];
		},
		[ servicesMap ]
	);
}
