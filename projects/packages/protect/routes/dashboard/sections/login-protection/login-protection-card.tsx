import { __ } from '@wordpress/i18n';
import { key } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { CardRow, ProtectCard, SettingsErrorRow, Stat } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
import TabLink from '../../components/tab-link';
import SsoToggle, { getSsoBlocker } from './sso-toggle';
import type { LoginProtectionContext } from './types';

/**
 * The Login protection card: blocked logins, and toggles for account protection and WordPress.com login.
 *
 * @param props          - The dashboard context.
 * @param props.state    - This section's state from PHP.
 * @param props.settings - Jetpack settings, for live module state.
 * @param props.openTab  - Switches dashboard tabs, for the links to Settings.
 * @return The card, or nothing without the section's state.
 */
export default function LoginProtectionCard( {
	state: login,
	settings,
	openTab,
}: LoginProtectionContext ) {
	if ( ! login ) {
		return null;
	}

	// Settings load on the Settings tab; until then the toggles show the page-load state.
	const data = {
		...settings,
		settings: {
			protect: login.bruteForce.active,
			'account-protection': login.accountProtection.active,
			sso: login.sso.active,
			...settings.settings,
		},
	};
	const bruteForceOn = Boolean( data.settings.protect );
	const ssoOn = Boolean( data.settings.sso ) && getSsoBlocker( login ) === null;

	return (
		<ProtectCard
			icon={ key }
			title={ __( 'Login protection', 'jetpack-protect-pkg' ) }
			description={ __(
				'Blocks password-guessing attacks and protects accounts with weak passwords.',
				'jetpack-protect-pkg'
			) }
		>
			<SettingsErrorRow settings={ settings } />
			<CardRow>
				{ bruteForceOn ? (
					<Stack direction="column" gap="md" align="start">
						<Stat
							label={ __( 'All-time blocked login attempts', 'jetpack-protect-pkg' ) }
							value={ login.blockedCount }
						/>
						<TabLink tab="settings" onOpen={ openTab }>
							{ __( 'Configure Brute Force Protection', 'jetpack-protect-pkg' ) }
						</TabLink>
					</Stack>
				) : (
					<SettingToggle
						data={ data }
						name="protect"
						disabled={ ! login.bruteForce.available }
						label={ __( 'Enable Brute Force Protection', 'jetpack-protect-pkg' ) }
						help={ __( 'Block IP addresses that keep failing to log in.', 'jetpack-protect-pkg' ) }
					/>
				) }
			</CardRow>
			<CardRow className="jp-protect-card__cells">
				<div>
					<SettingToggle
						data={ data }
						name="account-protection"
						disabled={ ! login.accountProtection.available }
						label={ __( 'Enable Account protection', 'jetpack-protect-pkg' ) }
						help={ __(
							'Keep administrator and editor accounts out of attackers’ hands.',
							'jetpack-protect-pkg'
						) }
					/>
				</div>
				<Stack direction="column" gap="md" align="start">
					<SsoToggle
						data={ data }
						login={ login }
						label={ __( 'Enable Secure Sign On', 'jetpack-protect-pkg' ) }
						help={ __(
							'Log in with WordPress.com and its two-step authentication.',
							'jetpack-protect-pkg'
						) }
					/>
					{ ssoOn && (
						<TabLink tab="settings" onOpen={ openTab }>
							{ __( 'Configure', 'jetpack-protect-pkg' ) }
						</TabLink>
					) }
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
