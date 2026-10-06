import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import IpListField from '../../components/settings/ip-list-field';
import SettingToggle from '../../components/settings/setting-toggle';
import type { DashboardContext } from '../types';
import type { LoginProtectionState } from './types';

const NO_LOCKS: LoginProtectionState[ 'ssoLocks' ] = { matchByEmail: false, twoStep: false };

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
					<SettingToggle
						data={ data }
						name="sso"
						label={ __( 'Allow users to log in with their WordPress.com account', 'jetpack' ) }
						help={ __(
							'If you have several sites with this on, you can log in to all of them with the same credentials.',
							'jetpack'
						) }
					/>
					<SettingToggle
						data={ data }
						name="jetpack_sso_match_by_email"
						label={ __( 'Match accounts using email addresses', 'jetpack' ) }
						help={
							ssoLocks.matchByEmail
								? __( 'This is set by your site’s configuration.', 'jetpack' )
								: undefined
						}
						disabled={ ! settings.sso || ssoLocks.matchByEmail }
					/>
					<SettingToggle
						data={ data }
						name="jetpack_sso_require_two_step"
						label={ __(
							'Require accounts to use WordPress.com Two-Step Authentication',
							'jetpack'
						) }
						help={
							ssoLocks.twoStep
								? __(
										'Two-Step Authentication is enforced by your site’s configuration.',
										'jetpack'
									)
								: undefined
						}
						disabled={ ! settings.sso || ssoLocks.twoStep }
					/>
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
