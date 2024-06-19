import { useCallback } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeSettingsButton from '../settings-button';
import { SupportedService, useSupportedServices } from '../services/use-supported-services';
import { ConnectionsListItem } from './connections-list-item';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';

export const ConnectionsList: React.FC = () => {
	const { connections, toggleById } = useSocialMediaConnections();

	const { needsUserConnection } = usePublicizeConfig();

	const supportedServices = useSupportedServices();
	const servicesByName = supportedServices.reduce< Record< string, SupportedService > >(
		( acc, service ) => {
			acc[ service.ID ] = service;
			return acc;
		},
		{}
	);

	const onToggle = useCallback(
		( connectionId: string ) => () => {
			toggleById( connectionId );
		},
		[ toggleById ]
	);

	return (
		<ul className={ styles[ 'connections-list' ] }>
			{ connections.map( connection => {
				return (
					<li className={ styles[ 'connection-list-item' ] } key={ connection.connection_id }>
						<ConnectionsListItem
							key={ connection.connection_id }
							connection={ connection }
							service={ servicesByName[ connection.service_name ] }
							onToggle={ onToggle( connection.connection_id ) }
						/>
					</li>
				);
			} ) }
			{ ! needsUserConnection ? (
				<li>
					<PublicizeSettingsButton />
				</li>
			) : null }
		</ul>
	);
};
