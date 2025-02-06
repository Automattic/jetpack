import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnection from '../connection';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { EnabledConnectionsNotice } from './enabled-connections-notice';
import { MediaValidationNotices } from './media-validation-notices';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';
import { UnsupportedConnectionsNotice } from './unsupported-connections-notice';
import { useConnectionState } from './use-connection-state';

export const ConnectionsList: React.FC = () => {
	const { recordEvent } = useAnalytics();

	const { connections, toggleById } = useSocialMediaConnections();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const { needsUserConnection, isPublicizeEnabled } = usePublicizeConfig();

	const toggleConnection = useCallback(
		( connectionId: string, connection ) => () => {
			toggleById( connectionId );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'editor',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<div>
			<ul className={ styles[ 'connections-list' ] }>
				{ connections.map( conn => {
					const { display_name, service_name, profile_picture, connection_id } = conn;

					return (
						<PublicizeConnection
							disabled={ shouldBeDisabled( conn ) }
							enabled={ canBeTurnedOn( conn ) && conn.enabled }
							key={ connection_id }
							id={ connection_id }
							label={ display_name }
							name={ service_name }
							toggleConnection={ toggleConnection( connection_id, conn ) }
							profilePicture={ profile_picture }
						/>
					);
				} ) }
			</ul>
			{ isPublicizeEnabled ? (
				<>
					<MediaValidationNotices />
					<BrokenConnectionsNotice />
					<UnsupportedConnectionsNotice />
					<EnabledConnectionsNotice />
				</>
			) : null }

			{ ! needsUserConnection ? <SettingsButton variant="secondary" /> : null }
		</div>
	);
};
