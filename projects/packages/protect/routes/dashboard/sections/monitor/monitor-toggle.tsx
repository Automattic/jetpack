import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SettingToggle from '../../components/settings/setting-toggle';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * Settings whose save, on turning Monitor on, also re-reads the email setting the server subscribes the user to.
 *
 * @param settings - Jetpack settings and their save function.
 * @return The wrapped settings, and whether that re-read is still pending.
 */
export function useMonitorToggleData( settings: ProtectSettingsData ) {
	const { save, refresh } = settings;
	const [ isEnabling, setIsEnabling ] = useState( false );
	const data = useMemo< ProtectSettingsData >(
		() => ( {
			...settings,
			save: async ( patch, path ) => {
				if ( patch.monitor !== true ) {
					return save( patch, path );
				}
				setIsEnabling( true );
				try {
					const saved = await save( patch, path );
					await refresh( [ 'monitor_receive_notifications' ] );
					return saved;
				} finally {
					setIsEnabling( false );
				}
			},
		} ),
		[ settings, save, refresh ]
	);
	return { data, isEnabling };
}

/**
 * Downtime monitoring's on/off toggle, on both the Overview and Settings cards.
 *
 * @param props               - Component props.
 * @param props.data          - Settings from `useMonitorToggleData()`.
 * @param props.available     - Whether Monitor can run on this site.
 * @param props.userConnected - Whether the user has a WordPress.com connection.
 * @return The toggle.
 */
export default function MonitorToggle( {
	data,
	available,
	userConnected,
}: {
	data: ProtectSettingsData;
	available: boolean;
	userConnected: boolean;
} ) {
	// Turning Monitor on subscribes that user to alerts, which needs their connection; turning off stays allowed.
	const needsAccount = available && ! userConnected && ! data.settings?.monitor;
	let help: string = __( 'Jetpack checks your site every five minutes.', 'jetpack-protect-pkg' );
	if ( ! available ) {
		help = __( 'Downtime monitoring isn’t available on this site.', 'jetpack-protect-pkg' );
	} else if ( needsAccount ) {
		help = __(
			'Connect your WordPress.com account to turn on downtime monitoring.',
			'jetpack-protect-pkg'
		);
	}
	return (
		<SettingToggle
			data={ data }
			name="monitor"
			label={ __( 'Enable downtime monitoring', 'jetpack-protect-pkg' ) }
			help={ help }
			disabled={ ! available || needsAccount }
		/>
	);
}
