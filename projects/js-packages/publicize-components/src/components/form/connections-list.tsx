import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnection from '../connection';
import { EnabledConnectionsNotice } from './enabled-connections-notice';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';
import { useConnectionState } from './use-connection-state';

export const ConnectionsList: React.FC = () => {
	const { recordEvent } = useAnalytics();

	const { connections, toggleById } = useSocialMediaConnections();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const { needsUserConnection } = usePublicizeConfig();

	const toggleConnection = useCallback(
		( connectionId: string, connection ) => () => {
			toggleById( connectionId );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'editor',
				new_state: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<div>
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
							toggleConnection={ toggleConnection( currentId, conn ) }
							profilePicture={ profile_picture }
						/>
					);
				} ) }
			</ul>
			<EnabledConnectionsNotice />
			{ ! needsUserConnection ? <SettingsButton variant="secondary" /> : null }
		</div>
	);
};
