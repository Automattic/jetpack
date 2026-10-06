import { ToggleControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { AlertDialog, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import IpListField from '../../components/settings/ip-list-field';
import SettingToggle from '../../components/settings/setting-toggle';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { DashboardContext } from '../types';
import type { LoginProtectionState } from './types';

const noop = () => {};
const NO_LOCKS: LoginProtectionState[ 'ssoLocks' ] = { matchByEmail: false, twoStep: false };

/**
 * A WordPress.com login option; a locked one shows the value SSO actually applies.
 *
 * @param props            - Component props.
 * @param props.data       - The settings and their save function.
 * @param props.name       - The setting key.
 * @param props.label      - The toggle's label.
 * @param props.lockedHelp - Help text shown while a filter or constant forces the value.
 * @param props.locked     - Whether a filter or constant forces the value.
 * @param props.effective  - The forced value.
 * @param props.ssoOn      - Whether WordPress.com login is on.
 * @return The toggle.
 */
function SsoOptionToggle( {
	data,
	name,
	label,
	lockedHelp,
	locked,
	effective,
	ssoOn,
}: {
	data: ProtectSettingsData;
	name: string;
	label: string;
	lockedHelp: string;
	locked: boolean;
	effective: boolean;
	ssoOn: boolean;
} ) {
	if ( ! locked ) {
		return <SettingToggle data={ data } name={ name } label={ label } disabled={ ! ssoOn } />;
	}

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ lockedHelp }
			checked={ effective }
			disabled
			onChange={ noop }
		/>
	);
}

/**
 * The Login protection settings: brute force protection, account protection and WordPress.com login.
 *
 * @param props          - The dashboard context.
 * @param props.state    - This section's state from PHP.
 * @param props.settings - The settings and their save function.
 * @return The card.
 */
export default function LoginProtectionSettingsCard( { state, settings: data }: DashboardContext ) {
	const login = state as LoginProtectionState | undefined;
	const settings = data.settings ?? {};
	const ssoLocks = login?.ssoLocks ?? NO_LOCKS;
	const ssoEffective = login?.ssoEffective ?? NO_LOCKS;
	const ssoUsable = login?.ssoUsable ?? false;
	const ssoOn = Boolean( settings.sso );
	const { save } = data;

	const [ confirmingSsoOff, setConfirmingSsoOff ] = useState( false );
	const onSsoChange = useCallback(
		( value: boolean ) => ( value ? save( { sso: true } ) : setConfirmingSsoOff( true ) ),
		[ save ]
	);
	const disableSso = useCallback( () => save( { sso: false } ), [ save ] );

	return (
		<ProtectCard icon={ lock } title={ __( 'Login protection', 'jetpack' ) }>
			<CardRow>
				<Stack direction="column" gap="md">
					<Text variant="body-lg" render={ <h3 /> } className="jp-protect-card__subheading">
						{ __( 'Brute force protection', 'jetpack' ) }
					</Text>
					<SettingToggle
						data={ data }
						name="protect"
						disabled={ ! login?.bruteForce.available }
						label={ __( 'Block repeated failed login attempts', 'jetpack' ) }
						help={ __(
							'Stops brute force attacks by blocking IP addresses that keep failing to log in.',
							'jetpack'
						) }
					/>
					<SettingToggle
						data={ data }
						name="jetpack_waf_ip_allow_list_enabled"
						label={ __( 'Always allow specific IP addresses', 'jetpack' ) }
						help={ __(
							'Allowed addresses are never blocked by the firewall or brute force protection.',
							'jetpack'
						) }
					/>
					{ Boolean( settings.jetpack_waf_ip_allow_list_enabled ) && (
						<IpListField
							data={ data }
							name="jetpack_waf_ip_allow_list"
							label={ __( 'Always allowed IP addresses', 'jetpack' ) }
							description={ __( 'One address or range per line.', 'jetpack' ) }
							currentIp={ login?.currentIp }
						/>
					) }
				</Stack>
			</CardRow>
			<CardRow>
				<Stack direction="column" gap="md">
					<Text variant="body-lg" render={ <h3 /> } className="jp-protect-card__subheading">
						{ __( 'Account protection', 'jetpack' ) }
					</Text>
					<SettingToggle
						data={ data }
						name="account-protection"
						disabled={ ! login?.accountProtection.available }
						label={ __( 'Protect accounts with weak or leaked passwords', 'jetpack' ) }
						help={ __(
							'Asks users with a compromised password to verify their identity and choose a new one.',
							'jetpack'
						) }
					/>
				</Stack>
			</CardRow>
			<CardRow>
				<Stack direction="column" gap="md">
					<Text variant="body-lg" render={ <h3 /> } className="jp-protect-card__subheading">
						{ __( 'WordPress.com login', 'jetpack' ) }
					</Text>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Allow users to log in with their WordPress.com account', 'jetpack' ) }
						help={
							ssoUsable
								? __(
										'If you have several sites with this on, you can log in to all of them with the same credentials.',
										'jetpack'
									)
								: __( 'Needs the site owner’s WordPress.com account to be connected.', 'jetpack' )
						}
						checked={ ssoOn }
						// Mirrors Jetpack Settings, which locks the toggle without a connected owner.
						disabled={ ! login?.sso.available || ! ssoUsable || data.isSaving( 'sso' ) }
						onChange={ onSsoChange }
					/>
					<SsoOptionToggle
						data={ data }
						name="jetpack_sso_match_by_email"
						label={ __( 'Match accounts using email addresses', 'jetpack' ) }
						lockedHelp={ __( 'This is set by your site’s configuration.', 'jetpack' ) }
						locked={ ssoLocks.matchByEmail }
						effective={ ssoEffective.matchByEmail }
						ssoOn={ ssoOn }
					/>
					<SsoOptionToggle
						data={ data }
						name="jetpack_sso_require_two_step"
						label={ __(
							'Require accounts to use WordPress.com Two-Step Authentication',
							'jetpack'
						) }
						lockedHelp={ __(
							'Two-Step Authentication is enforced by your site’s configuration.',
							'jetpack'
						) }
						locked={ ssoLocks.twoStep }
						effective={ ssoEffective.twoStep }
						ssoOn={ ssoOn }
					/>
				</Stack>
			</CardRow>
			<AlertDialog.Root
				open={ confirmingSsoOff }
				onOpenChange={ setConfirmingSsoOff }
				onConfirm={ disableSso }
			>
				<AlertDialog.Popup
					title={ __( 'Turn off WordPress.com login?', 'jetpack' ) }
					description={ __(
						'Users will have to log in with their username and password on this site instead.',
						'jetpack'
					) }
					confirmButtonText={ __( 'Turn off', 'jetpack' ) }
				/>
			</AlertDialog.Root>
		</ProtectCard>
	);
}
