import { Button } from '@automattic/jetpack-components';
import { Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { useService } from '../services/use-service';
import { ConnectionInfo } from './connection-info';
import styles from './style.module.scss';

const ConnectionManagement = ( { className = null, disabled = false } ) => {
	const { refresh } = useSocialMediaConnections();

	const connections = useSelect( select => select( store ).getConnections(), [] );

	const deletingConnections = useSelect( select => select( store ).getDeletingConnections(), [] );

	const updatingConnections = useSelect( select => select( store ).getUpdatingConnections(), [] );

	// Sort connections (moved outside useSelect to prevent sorting on every render)
	connections.sort( ( a, b ) => {
		if ( a.service_name === b.service_name ) {
			return a.connection_id.localeCompare( b.connection_id );
		}
		return a.service_name.localeCompare( b.service_name );
	} );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const getService = useService();

	const { openConnectionsModal } = useDispatch( store );

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<div
			className={ clsx( styles.wrapper, className ) }
			// @ts-expect-error inert propery is not yet in react types
			inert={ disabled ? 'true' : undefined }
		>
			{ connections.length ? (
				<>
					<h3>{ __( 'Connected accounts', 'jetpack-publicize-components' ) }</h3>
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
											service={ getService( connection.service_name ) }
											canMarkAsShared={ canMarkAsShared }
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
				{ __( 'Connect an account', 'jetpack-publicize-components' ) }
			</Button>
		</div>
	);
};

export default ConnectionManagement;
