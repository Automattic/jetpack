import { Button } from '@automattic/jetpack-components';
import { Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { SupportedService, useSupportedServices } from '../services/use-supported-services';
import { ConnectionInfo } from './connection-info';
import styles from './style.module.scss';

const ConnectionManagement = ( { className = null } ) => {
	const { refresh } = useSocialMediaConnections();

	const { connections, deletingConnections, updatingConnections } = useSelect( select => {
		const { getConnections, getDeletingConnections, getUpdatingConnections } = select( store );

		return {
			connections: getConnections(),
			deletingConnections: getDeletingConnections(),
			updatingConnections: getUpdatingConnections(),
		};
	}, [] );

	connections.sort( ( a, b ) => {
		if ( a.service_name === b.service_name ) {
			return a.connection_id.localeCompare( b.connection_id );
		}
		return a.service_name.localeCompare( b.service_name );
	} );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const supportedServices = useSupportedServices();
	const servicesByName = supportedServices.reduce< Record< string, SupportedService > >(
		( acc, service ) => {
			acc[ service.ID ] = service;
			return acc;
		},
		{}
	);

	const { openConnectionsModal } = useDispatch( store );

	return (
		<div className={ clsx( styles.wrapper, className ) }>
			{ connections.length ? (
				<>
					<h3>{ __( 'Connected accounts', 'jetpack' ) }</h3>
					<ul className={ styles[ 'connection-list' ] }>
						{ connections.map( connection => {
							const isUpdatingOrDeleting =
								updatingConnections.includes( connection.connection_id ) ||
								deletingConnections.includes( connection.connection_id );

							return (
								<li className={ styles[ 'connection-list-item' ] } key={ connection.connection_id }>
									<Disabled isDisabled={ isUpdatingOrDeleting }>
										<ConnectionInfo
											connection={ connection }
											service={ servicesByName[ connection.service_name ] }
										/>
									</Disabled>
								</li>
							);
						} ) }
					</ul>
				</>
			) : null }
			<ManageConnectionsModal />
			<Button
				variant={ connections.length ? 'secondary' : 'primary' }
				onClick={ openConnectionsModal }
			>
				{ __( 'Connect an account', 'jetpack' ) }
			</Button>
		</div>
	);
};

export default ConnectionManagement;
