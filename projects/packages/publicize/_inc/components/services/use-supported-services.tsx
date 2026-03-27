import '@automattic/ui/style.css';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { SupportedService } from './types';
import { getServiceUiDetails } from './utils';

/**
 * Get the list of supported services.
 *
 * @return The list of supported services
 */
export function useSupportedServices() {
	const supportedServices = useSelect( select => select( socialStore ).getServicesList(), [] );

	return useMemo( () => {
		return supportedServices
			.filter(
				// Filter out unsupported services
				( { status } ) => status === 'ok'
			)
			.map< SupportedService >( service => ( {
				...service,
				...getServiceUiDetails( service.id ),
			} ) );
	}, [ supportedServices ] );
}
