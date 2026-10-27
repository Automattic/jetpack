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
 * @param props           - Component props.
 * @param props.data      - Settings from `useMonitorToggleData()`.
 * @param props.available - Whether Monitor can run on this site.
 * @return The toggle.
 */
export default function MonitorToggle( {
	data,
	available,
}: {
	data: ProtectSettingsData;
	available: boolean;
} ) {
	return (
		<SettingToggle
			data={ data }
			name="monitor"
			label={ __( 'Enable downtime monitoring', 'jetpack-protect-pkg' ) }
			help={
				available
					? __( 'Jetpack checks your site every five minutes.', 'jetpack-protect-pkg' )
					: __( 'Downtime monitoring isn’t available on this site.', 'jetpack-protect-pkg' )
			}
			disabled={ ! available }
		/>
	);
}
