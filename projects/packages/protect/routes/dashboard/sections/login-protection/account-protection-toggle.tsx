import { __ } from '@wordpress/i18n';
import SettingToggle from '../../components/settings/setting-toggle';
import type { LoginProtectionState } from './types';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * The account protection toggle, which says why when it can't be used.
 *
 * @param props       - Component props.
 * @param props.data  - The settings and their save function.
 * @param props.login - This section's state from PHP.
 * @param props.label - The toggle's label.
 * @param props.help  - What it does, shown unless it can't be used.
 * @return The toggle.
 */
export default function AccountProtectionToggle( {
	data,
	login,
	label,
	help,
}: {
	data: ProtectSettingsData;
	login: LoginProtectionState | undefined;
	label: string;
	help: string;
} ) {
	const unavailable = login !== undefined && ! login.accountProtection.available;

	return (
		<SettingToggle
			data={ data }
			name="account-protection"
			disabled={ ! login?.accountProtection.available }
			label={ label }
			help={
				unavailable
					? __( 'Account protection isn’t available on this site.', 'jetpack-protect-pkg' )
					: help
			}
		/>
	);
}
