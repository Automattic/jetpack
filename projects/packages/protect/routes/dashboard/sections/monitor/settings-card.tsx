import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
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
	const { save, refresh } = settings;
	// Turning Monitor on subscribes the user to its emails on the server.
	const monitorData = useMemo(
		() => ( {
			...settings,
			save: async ( patch, path ) => {
				await save( patch, path );
				if ( patch.monitor === true ) {
					await refresh( [ 'monitor_receive_notifications' ] );
				}
			},
		} ),
		[ settings, save, refresh ]
	);
	return (
		<ProtectCard icon={ seen } title={ __( 'Monitor', 'jetpack-protect-pkg' ) }>
			<CardRow>
				<Stack direction="column" gap="md">
					<SettingToggle
						data={ monitorData }
						name="monitor"
						label={ __( 'Monitor your site for downtime', 'jetpack-protect-pkg' ) }
						help={
							available
								? __( 'Jetpack checks your site every five minutes.', 'jetpack-protect-pkg' )
								: __( 'Downtime monitoring isn’t available on this site.', 'jetpack-protect-pkg' )
						}
						disabled={ ! available }
					/>
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
							settings.isSaving( 'monitor' )
						}
					/>
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
