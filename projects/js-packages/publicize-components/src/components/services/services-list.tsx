import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceItem } from './service-item';
import styles from './style.module.scss';
import { useSupportedServices } from './use-supported-services';

/**
 * Services list component
 *
 * @return {import('react').ReactNode} Services list component
 */
export function ServicesList() {
	const supportedServices = useSupportedServices();

	const allConnections = useSelect( select => {
		return select( store ).getConnections();
	}, [] );

	const connections = useMemo( () => {
		return allConnections.reduce< Record< string, Array< Connection > > >(
			( bucket, connection ) => {
				if ( ! bucket[ connection.service_name ] ) {
					bucket[ connection.service_name ] = [];
				}

				bucket[ connection.service_name ].push( connection );

				return bucket;
			},
			{}
		);
	}, [ allConnections ] );

	const reconnectingAccount = useSelect( select => select( store ).getReconnectingAccount(), [] );

	return (
		<ul className={ styles.services }>
			{ supportedServices.map( service => (
				<li key={ service.id } className={ styles[ 'service-list-item' ] }>
					<ServiceItem
						service={ service }
						serviceConnections={ connections[ service.id ] || [] }
						isPanelDefaultOpen={ reconnectingAccount?.service_name === service.id }
					/>
				</li>
			) ) }
		</ul>
	);
}
