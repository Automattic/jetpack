import { Disabled } from '@wordpress/components';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { ConnectionsToggleList } from '../connections-toggle-list';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { MediaValidationNotices } from './media-validation-notices';
import { SettingsButton } from './settings-button';

export const ConnectionsList: React.FC = () => {
	const { needsUserConnection, isPublicizeEnabled } = usePublicizeConfig();

	return (
		<div>
			<Disabled isDisabled={ ! isPublicizeEnabled }>
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
