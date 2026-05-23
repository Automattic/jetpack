import { Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { useIsModernized } from '../../hooks/use-is-modernized';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { useService } from '../services/use-service';
import { ConnectionInfo } from './connection-info';
import { ModernConnectionInfo } from './connection-info-modern';
import modernStyles from './style-modern.module.scss';
import styles from './style.module.scss';

const ConnectionManagement = ( {
	className = null,
	disabled = false,
	hideConnectButton = false,
	hideHeading = false,
} ) => {
	const isModernized = useIsModernized();
	const ConnectionInfoVariant = isModernized ? ModernConnectionInfo : ConnectionInfo;
	// The modernized chassis owns its list chrome (edge-to-edge dividers, no
	// outline, rows supply their own padding). The legacy admin page / block
	// editor keep the trunk `style.module.scss` classes byte-for-byte.
	const listStyles = isModernized ? modernStyles : styles;
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

	const getService = useService();

	const { openConnectionsModal } = useDispatch( store );

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<div
			className={ clsx( listStyles.wrapper, className ) }
			// @ts-expect-error inert propery is not yet in react types
			inert={ disabled ? 'true' : undefined }
		>
			{ connections.length ? (
				<>
					{ ! hideHeading && <h3>{ __( 'Connected accounts', 'jetpack-publicize-pkg' ) }</h3> }
					<ul className={ listStyles[ 'connection-list' ] }>
						{ connections.map( connection => {
							const isUpdatingOrDeleting =
								updatingConnections.includes( connection.connection_id ) ||
								deletingConnections.includes( connection.connection_id );

							return (
								<li
									className={ listStyles[ 'connection-list-item' ] }
									key={ connection.connection_id }
								>
									<Disabled isDisabled={ isUpdatingOrDeleting }>
										<ConnectionInfoVariant
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
			{ ! hideConnectButton && (
				<Button
					variant={ connections.length ? 'outline' : 'solid' }
					onClick={ openConnectionsModal }
				>
					{ __( 'Connect an account', 'jetpack-publicize-pkg' ) }
				</Button>
			) }
		</div>
	);
};

export default ConnectionManagement;
