import { Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { ConnectionsToggleList } from '../connections-toggle-list';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { MediaValidationNotices } from './media-validation-notices';
import { SettingsButton } from './settings-button';

export const ConnectionsList: React.FC = () => {
	const { needsUserConnection, isPublicizeEnabled } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const disableConnectionsList =
		// We want to disable the connections list if Publicize is disabled
		! isPublicizeEnabled ||
		// or if the user needs to connect their WordPress.com account
		// to reshare a published post.
		( isPostPublished && needsUserConnection );

	return (
		<div>
			<Disabled isDisabled={ disableConnectionsList }>
				<ConnectionsToggleList />
			</Disabled>
			{ isPublicizeEnabled ? (
				<>
					<MediaValidationNotices />
					<BrokenConnectionsNotice />
				</>
			) : null }

			{ ! needsUserConnection ? <SettingsButton variant="secondary" /> : null }
		</div>
	);
};
