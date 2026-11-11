import { __ } from '@wordpress/i18n';
import SettingToggle from '../../components/settings/setting-toggle';
import type { LoginProtectionState } from './types';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

type Module = 'protect' | 'account-protection';

const STATE_KEYS = {
	protect: 'bruteForce',
	'account-protection': 'accountProtection',
} as const;

/**
 * Why a module can't be used, worded once for the Overview and Settings cards.
 *
 * @param name - The module slug.
 * @return The reason.
 */
function getUnavailableReason( name: Module ): string {
	return name === 'protect'
		? __( 'Login protection isn’t available on this site.', 'jetpack-protect-pkg' )
		: __( 'Account protection isn’t available on this site.', 'jetpack-protect-pkg' );
}

/**
 * A login protection module's toggle, which says why when it can't be used.
 *
 * @param props       - Component props.
 * @param props.data  - The settings and their save function.
 * @param props.login - This section's state from PHP.
 * @param props.name  - The module slug.
 * @param props.label - The toggle's label.
 * @param props.help  - What it does, shown unless it can't be used.
 * @return The toggle.
 */
export default function ModuleToggle( {
	data,
	login,
	name,
	label,
	help,
}: {
	data: ProtectSettingsData;
	login: LoginProtectionState | undefined;
	name: Module;
	label: string;
	help: string;
} ) {
	const module = login?.[ STATE_KEYS[ name ] ];
	// Without the section's state the toggle stays locked, but nothing says the module is missing.
	const unavailable = module !== undefined && ! module.available;

	return (
		<SettingToggle
			data={ data }
			name={ name }
			disabled={ ! module?.available }
			label={ label }
			help={ unavailable ? getUnavailableReason( name ) : help }
		/>
	);
}
