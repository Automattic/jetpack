import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { Card } from '@wordpress/ui';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ModernServiceItem } from './service-item-modern';
import styles from './style-modern.module.scss';
import { useSupportedServices } from './use-supported-services';

/**
 * Services list component
 *
 * @return {import('react').ReactNode} Services list component
 */
export function ModernServicesList() {
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
		<Card.Root>
			<ul className={ styles.services }>
				{ supportedServices.map( service => (
					<li key={ service.id } className={ styles[ 'service-list-item' ] }>
						<ModernServiceItem
							service={ service }
							serviceConnections={ connections[ service.id ] || [] }
							isPanelDefaultOpen={ reconnectingAccount?.service_name === service.id }
						/>
					</li>
				) ) }
			</ul>
		</Card.Root>
	);
}
