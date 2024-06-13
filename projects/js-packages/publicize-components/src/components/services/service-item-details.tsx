import { useBreakpointMatch } from '@automattic/jetpack-components';
import { Disabled } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceConnectionInfo } from './service-connection-info';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

export type ServicesItemDetailsProps = {
	service: SupportedService;
	serviceConnections?: Array< Connection >;
};

/**
 * Service item details component
 *
 * @param {ServicesItemDetailsProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service item details component
 */
export function ServiceItemDetails( { service, serviceConnections }: ServicesItemDetailsProps ) {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const { deletingConnections, updatingConnections } = useSelect( select => {
		const { getDeletingConnections, getUpdatingConnections } = select( socialStore );

		return {
			deletingConnections: getDeletingConnections(),
			updatingConnections: getUpdatingConnections(),
		};
	}, [] );

	const isAdmin = useSelect( select => select( coreStore ).canUser( 'update', 'settings' ), [] );

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
								<ServiceConnectionInfo
									connection={ connection }
									service={ service }
									isAdmin={ isAdmin }
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
				<div key={ service.ID + idx } className={ styles.example }>
					<Example />
				</div>
			) ) }
		</div>
	);
}
