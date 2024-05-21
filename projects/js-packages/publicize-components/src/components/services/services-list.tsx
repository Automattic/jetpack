import { useSelect } from '@wordpress/data';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceItem, ServicesItemProps } from './service-item';
import styles from './style.module.scss';
import { SupportedService, useSupportedServices } from './use-supported-services';

type ServicesListProps = Pick< ServicesItemProps, 'onConfirm' > & {
	defaultExpandedService?: SupportedService;
};

/**
 * Services list component
 *
 * @param {ServicesListProps} props - Component props
 *
 * @returns {import('react').ReactNode} Services list component
 */
export function ServicesList( { onConfirm, defaultExpandedService }: ServicesListProps ) {
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
					<ServiceItem
						service={ service }
						onConfirm={ onConfirm }
						initialOpenPanel={ service.ID === defaultExpandedService?.ID }
						serviceConnections={ connections[ service.ID ] || [] }
					/>
				</li>
			) ) }
		</ul>
	);
}
