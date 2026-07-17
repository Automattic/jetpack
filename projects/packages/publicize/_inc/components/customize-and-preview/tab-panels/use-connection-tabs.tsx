import clsx from 'clsx';
import { useMemo } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import ConnectionIcon from '../../connection-icon';
import styles from './styles.module.scss';
import { ConnectionTab } from './types';

/**
 * Hook to get connection tabs for customize and preview modal.
 *
 * @return array of connection tabs
 */
export function useConnectionTabs() {
	const { connections } = useSocialMediaConnections();

	return useMemo( () => {
		return connections.map< ConnectionTab >( connection => {
			return {
				connectionId: connection.connection_id,
				name: connection.connection_id,
				title: `${ connection.display_name } (${ connection.service_label })`,
				icon: (
					<ConnectionIcon
						serviceName={ connection.service_name }
						// Avoid screen reader reading the label twice when the item is focused
						label=""
						profilePicture={ connection.profile_picture }
						className={ clsx( { [ styles[ 'enabled-connection' ] ]: connection.enabled } ) }
					/>
				),
			};
		} );
	}, [ connections ] );
}
