import { useConnection } from '@automattic/jetpack-connection';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';
import styles from './styles.module.scss';
import { useConnectionState } from './use-connection-state';

export const ConnectionsList: React.FC = () => {
	const { connections, toggleById } = useSocialMediaConnections();

	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const { isUserConnected } = useConnection();

	return (
		<ul className={ styles[ 'connections-list' ] }>
			{ connections.map( conn => {
				const { display_name, id, service_name, profile_picture, connection_id } = conn;
				const currentId = connection_id ? connection_id : id;

				return (
					<PublicizeConnection
						disabled={ shouldBeDisabled( conn ) }
						enabled={ canBeTurnedOn( conn ) && conn.enabled }
						key={ currentId }
						id={ currentId }
						label={ display_name }
						name={ service_name }
						toggleConnection={ toggleById }
						profilePicture={ profile_picture }
					/>
				);
			} ) }
			{ isUserConnected ? (
				<li>
					<PublicizeSettingsButton />
				</li>
			) : null }
		</ul>
	);
};
