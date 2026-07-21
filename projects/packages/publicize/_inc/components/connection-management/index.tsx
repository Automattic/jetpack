import { Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { useIsModernized } from '../../hooks/use-is-modernized';
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
			// TODO(react-19): React 18 strips boolean `inert` and warns; the
			// string form below is the only one that renders in React 18.
			// When Gutenberg bumps to React 19, switch this to
			// `inert={ disabled || undefined }` and remove the
			// `@ts-expect-error` (which `inert` will satisfy once it lands in
			// the stable `@types/react` HTMLAttributes interface).
			// @ts-expect-error inert property is not yet in react types
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
