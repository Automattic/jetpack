import { Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { inertValue } from '@wordpress/react-inert-value';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { hasAdminUiV2 } from '../../utils/script-data';
import { ConnectionFlowModal } from '../connection-flow';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { useService } from '../services/use-service';
import { ConnectionInfo } from './connection-info';
import listStyles from './style.module.scss';

const ConnectionManagement = ( {
	className = null,
	disabled = false,
	hideConnectButton = false,
	hideHeading = false,
} ) => {
	const {
		connections: rawConnections,
		deletingConnections,
		updatingConnections,
	} = useSelect( select => {
		const { getConnections, getDeletingConnections, getUpdatingConnections } = select( store );

		return {
			connections: getConnections(),
			deletingConnections: getDeletingConnections(),
			updatingConnections: getUpdatingConnections(),
		};
	}, [] );

	// Copy before sorting — `getConnections()` returns the store's array and
	// `Array.prototype.sort` mutates in place.
	const connections = [ ...rawConnections ].sort( ( a, b ) => {
		if ( a.service_name === b.service_name ) {
			return a.connection_id.localeCompare( b.connection_id );
		}
		return a.service_name.localeCompare( b.service_name );
	} );

	const getService = useService();

	const { openConnectionsModal } = useDispatch( store );

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<div
			className={ clsx( listStyles.wrapper, className ) }
			// @ts-expect-error inert property is not in the React 18 types
			inert={ inertValue( disabled ) }
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
			{ hasAdminUiV2() ? <ConnectionFlowModal /> : <ManageConnectionsModal /> }
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
