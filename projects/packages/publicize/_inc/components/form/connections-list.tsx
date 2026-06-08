/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Disabled, __experimentalSpacer as Spacer } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { Connection } from '../../social-store/types';
import { ConnectionsToggleList } from '../connections-toggle-list';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { MediaValidationNotices } from './media-validation-notices';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';

export const ConnectionsList: React.FC = () => {
	const { needsUserConnection, isPublicizeEnabled } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const disableConnectionsList =
		// We want to disable the connections list if Publicize is disabled
		! isPublicizeEnabled ||
		// or if the user needs to connect their WordPress.com account
		// to reshare a published post.
		( isPostPublished && needsUserConnection );
	const { recordEvent } = useAnalytics();
	const { toggleById } = useSocialMediaConnections();

	const onClickConnection = useCallback(
		( connection: Connection ) => {
			toggleById( connection.connection_id );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'editor',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<div className={ styles[ 'connections-list-wrapper' ] }>
			<Disabled isDisabled={ disableConnectionsList }>
				<div className={ styles[ 'connections-list' ] }>
					<ConnectionsToggleList onClickItem={ onClickConnection } />
				</div>
			</Disabled>
			{ isPublicizeEnabled ? (
				<>
					<Spacer marginTop="1rem" />
					<MediaValidationNotices />
					<BrokenConnectionsNotice />
				</>
			) : null }

			{ ! needsUserConnection ? <SettingsButton variant="secondary" /> : null }
		</div>
	);
};
