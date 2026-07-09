import { Disabled } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';
import { useIsModernized } from '../../hooks/use-is-modernized';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceConnectionInfo } from './service-connection-info';
import { ModernServiceConnectionInfo } from './service-connection-info-modern';
import styles from './style.module.scss';
import { SupportedService } from './types';

export type ServicesItemDetailsProps = {
	service: SupportedService;
	serviceConnections: Array< Connection >;
};

/**
 * Service item details component
 *
 * @param {ServicesItemDetailsProps} props - Component props
 *
 * @return {import('react').ReactNode} Service item details component
 */
export function ServiceItemDetails( { service, serviceConnections }: ServicesItemDetailsProps ) {
	const isModernized = useIsModernized();
	const ServiceConnectionInfoVariant = isModernized
		? ModernServiceConnectionInfo
		: ServiceConnectionInfo;
	const isSmall = useViewportMatch( 'small', '<' );

	const { deletingConnections, updatingConnections } = useSelect( select => {
		const { getDeletingConnections, getUpdatingConnections } = select( socialStore );

		return {
			deletingConnections: getDeletingConnections(),
			updatingConnections: getUpdatingConnections(),
		};
	}, [] );

	const canMarkAsShared = useUserCanShareConnection();

	if ( serviceConnections.length ) {
		return (
			<ul className={ styles[ 'service-connection-list' ] }>
				{ serviceConnections.map( connection => {
					const isUpdatingOrDeleting =
						updatingConnections.includes( connection.connection_id ) ||
						deletingConnections.includes( connection.connection_id );

					return (
						<li key={ connection.connection_id }>
							<Disabled isDisabled={ isUpdatingOrDeleting }>
								<ServiceConnectionInfoVariant
									connection={ connection }
									service={ service }
									canMarkAsShared={ canMarkAsShared }
								/>
							</Disabled>
						</li>
					);
				} ) }
			</ul>
		);
	}

	return (
		<div
			className={ clsx( styles[ 'example-wrapper' ], {
				[ styles.small ]: isSmall,
			} ) }
		>
			{ service.examples.map( ( Example, idx ) => (
				<div key={ service.id + idx } className={ styles.example }>
					<Example />
				</div>
			) ) }
		</div>
	);
}
