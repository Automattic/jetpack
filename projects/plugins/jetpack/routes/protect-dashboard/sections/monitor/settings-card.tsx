import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
import type { DashboardContext } from '../types';

/**
 * The Monitor settings: downtime monitoring and its email alerts.
 *
 * @param props          - The dashboard context.
 * @param props.settings - Jetpack settings and their save function.
 * @return The card.
 */
export default function MonitorSettingsCard( { settings }: DashboardContext ) {
	return (
		<ProtectCard icon={ seen } title={ __( 'Monitor', 'jetpack' ) }>
			<CardRow>
				<Stack direction="column" gap="md">
					<SettingToggle
						data={ settings }
						name="monitor"
						label={ __( 'Monitor your site for downtime', 'jetpack' ) }
						help={ __( 'Jetpack checks your site every five minutes.', 'jetpack' ) }
					/>
					<SettingToggle
						data={ settings }
						name="monitor_receive_notifications"
						label={ __( 'Email me when my site goes down and comes back up', 'jetpack' ) }
						help={ __( 'Emails go to your WordPress.com account’s address.', 'jetpack' ) }
						disabled={ ! settings.settings?.monitor }
					/>
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
