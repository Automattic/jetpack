import { __ } from '@wordpress/i18n';
import SettingToggle from '../../components/settings/setting-toggle';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * The firewall's on/off toggle, on both the Overview and Settings cards.
 *
 * @param props      - Component props.
 * @param props.data - The settings and their save function.
 * @return The toggle.
 */
export default function FirewallToggle( { data }: { data: ProtectSettingsData } ) {
	return (
		<SettingToggle
			data={ data }
			name="waf"
			label={ __( 'Enable firewall', 'jetpack-protect-pkg' ) }
			help={ __(
				'Inspects every request against Jetpack’s firewall rules.',
				'jetpack-protect-pkg'
			) }
		/>
	);
}
