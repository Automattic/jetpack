import { useSelect } from '@wordpress/data';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceItem } from './service-item';
import styles from './style.module.scss';
import { useSupportedServices } from './use-supported-services';

/**
 * Services list component
 *
 * @returns {import('react').ReactNode} Services list component
 */
export function ServicesList() {
	const supportedServices = useSupportedServices();

	const connections = useSelect( select => {
		return select( store )
			.getConnections()
			.reduce< Record< string, Array< Connection > > >( ( bucket, connection ) => {
				if ( ! bucket[ connection.service_name ] ) {
					bucket[ connection.service_name ] = [];
				}

				bucket[ connection.service_name ].push( connection );

				return bucket;
			}, {} );
	}, [] );

	return (
		<ul className={ styles.services }>
			{ supportedServices.map( service => (
				<li key={ service.ID } className={ styles[ 'service-list-item' ] }>
					<ServiceItem service={ service } serviceConnections={ connections[ service.ID ] || [] } />
				</li>
			) ) }
		</ul>
	);
}
