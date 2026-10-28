import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { key } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { CardRow, ProtectCard, SettingsErrorRow, Stat } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
import TabLink from '../../components/tab-link';
import SsoToggle, { getSsoBlocker } from './sso-toggle';
import type { LoginProtectionContext, LoginProtectionState } from './types';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/** Opens the Settings tab at this section's card. */
const SETTINGS_PARAMS = { section: 'loginProtection' };

// The settings this card saves.
const LOGIN_KEYS = [ 'protect', 'account-protection', 'sso' ];

/**
 * Blocked logins while login protection is on, else a toggle to turn it on.
 *
 * @param props         - Component props.
 * @param props.data    - The settings, with page-load state filled in.
 * @param props.login   - This section's state from PHP.
 * @param props.openTab - Switches dashboard tabs, for the link to Settings.
 * @return The row.
 */
function BruteForceRow( {
	data,
	login,
	openTab,
}: {
	data: ProtectSettingsData;
	login: LoginProtectionState;
	openTab: LoginProtectionContext[ 'openTab' ];
} ) {
	const isOn = Boolean( data.settings?.protect );
	const rowRef = useRef< HTMLDivElement >( null );
	const wasOn = useRef( isOn );

	useEffect( () => {
		const row = rowRef.current;
		// Switching swaps out the focused control, so keep keyboard focus in the row.
		if (
			row &&
			isOn !== wasOn.current &&
			row.ownerDocument.activeElement === row.ownerDocument.body
		) {
			row.querySelector< HTMLElement >( 'a, [role="switch"]' )?.focus();
		}
		wasOn.current = isOn;
	}, [ isOn ] );

	return (
		<CardRow>
			<div ref={ rowRef }>
				{ isOn ? (
					<Stack direction="column" gap="md" align="start">
						<Stat
							label={ __( 'All-time blocked login attempts', 'jetpack-protect-pkg' ) }
							value={ login.blockedCount }
						/>
						<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
							{ __( 'Configure login protection', 'jetpack-protect-pkg' ) }
						</TabLink>
					</Stack>
				) : (
					<SettingToggle
						data={ data }
						name="protect"
						disabled={ ! login.bruteForce.available }
						label={ __( 'Enable login protection', 'jetpack-protect-pkg' ) }
						help={
							login.bruteForce.available
								? __( 'Block IP addresses that keep failing to log in.', 'jetpack-protect-pkg' )
								: __( 'Login protection isn’t available on this site.', 'jetpack-protect-pkg' )
						}
					/>
				) }
			</div>
		</CardRow>
	);
}

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
			<SettingsErrorRow settings={ settings } keys={ LOGIN_KEYS } />
			<BruteForceRow data={ data } login={ login } openTab={ openTab } />
			<CardRow className="jp-protect-card__cells">
				<div>
					<SettingToggle
						data={ data }
						name="account-protection"
						disabled={ ! login.accountProtection.available }
						label={ __( 'Enable account protection', 'jetpack-protect-pkg' ) }
						help={
							login.accountProtection.available
								? __(
										'Keep administrator and editor accounts out of attackers’ hands.',
										'jetpack-protect-pkg'
									)
								: __( 'Account protection isn’t available on this site.', 'jetpack-protect-pkg' )
						}
					/>
				</div>
				<Stack direction="column" gap="md" align="start">
					<SsoToggle
						data={ data }
						login={ login }
						label={ __( 'Enable WordPress.com login (SSO)', 'jetpack-protect-pkg' ) }
						help={ __(
							'Log in with WordPress.com and its two-step authentication.',
							'jetpack-protect-pkg'
						) }
					/>
					{ ssoOn && (
						<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
							{ __( 'Configure WordPress.com login (SSO)', 'jetpack-protect-pkg' ) }
						</TabLink>
					) }
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
