import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
import gauge from './icon';
import MonitorToggle, { useMonitorToggleData } from './monitor-toggle';
import type { MonitorContext } from './types';

/**
 * The Monitor settings: downtime monitoring and its email alerts.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The Monitor module's state from PHP.
 * @param props.settings - Jetpack settings and their save function.
 * @return The card.
 */
export default function MonitorSettingsCard( { state, settings }: MonitorContext ) {
	const available = Boolean( state?.available );
	const userConnected = Boolean( state?.userConnected );
	const { data: monitorData, isEnabling } = useMonitorToggleData( settings );
	return (
		<ProtectCard icon={ gauge } title={ __( 'Downtime monitoring', 'jetpack-protect-pkg' ) }>
			<CardRow>
				<Stack direction="column" gap="md">
					<MonitorToggle data={ monitorData } available={ available } />
					<SettingToggle
						data={ settings }
						name="monitor_receive_notifications"
						label={ __(
							'Email me when my site goes down and comes back up',
							'jetpack-protect-pkg'
						) }
						help={
							userConnected
								? __( 'Emails go to your WordPress.com account’s address.', 'jetpack-protect-pkg' )
								: __(
										'Connect your WordPress.com account to manage these emails.',
										'jetpack-protect-pkg'
									)
						}
						disabled={
							! available ||
							! userConnected ||
							! settings.settings?.monitor ||
							settings.isSaving( 'monitor' ) ||
							isEnabling
						}
					/>
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
