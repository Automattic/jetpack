import { ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import IpListField from '../../components/settings/ip-list-field';
import SettingToggle from '../../components/settings/setting-toggle';
import FirewallToggle from './firewall-toggle';
import HostFirewallCard from './host-firewall-card';
import shieldFlame from './icon';
import { AUTOMATIC_RULES, IP_ALLOW_LIST, IP_BLOCK_LIST, enabledKey } from './settings-keys';
import type { FirewallContext } from './types';

const SHARE_DATA = 'jetpack_waf_share_data';
const SHARE_DEBUG_DATA = 'jetpack_waf_share_debug_data';
// Saving through the WAF endpoint keeps the two share options coupled and regenerates the standalone bootstrap.
const WAF_PATH = '/jetpack/v4/waf';

/**
 * How to run the firewall before WordPress loads, or, once it does, how to undo that.
 *
 * @param props               - Component props.
 * @param props.bootstrapPath - The file `auto_prepend_file` must point to.
 * @param props.standalone    - Whether the firewall already runs before WordPress.
 * @return The row.
 */
function StandaloneModeRow( {
	bootstrapPath,
	standalone,
}: {
	bootstrapPath: string;
	standalone: boolean;
} ) {
	const code = <code className="jp-protect-firewall-standalone__code" />;
	const text = standalone
		? createInterpolateElement(
				__(
					'The firewall runs before WordPress loads, so it inspects every request. Remove the <code>auto_prepend_file</code> PHP directive if you turn the firewall off or uninstall Jetpack.',
					'jetpack-protect-pkg'
				),
				{ code }
			)
		: createInterpolateElement(
				__(
					'Run the firewall before WordPress loads so it can inspect every request. Set the <code>auto_prepend_file</code> PHP directive to <path/>, usually in an .htaccess file or your PHP configuration; your host can help. Remove it again if you turn the firewall off or uninstall Jetpack.',
					'jetpack-protect-pkg'
				),
				{
					code,
					path: <code className="jp-protect-firewall-standalone__code">{ bootstrapPath }</code>,
				}
			);

	return (
		<CardRow>
			<Stack direction="column" gap="sm">
				<Text variant="body-lg" render={ <h3 /> } className="jp-protect-card__subheading">
					{ __( 'Standalone mode', 'jetpack-protect-pkg' ) }
				</Text>
				<Text variant="body-md" render={ <p /> } className="jp-protect-firewall-standalone">
					{ text }
				</Text>
			</Stack>
		</CardRow>
	);
}

/**
 * The firewall's Settings card: on/off, automatic rules, the IP block list and data sharing.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The firewall's state from page load.
 * @param props.settings - Jetpack settings and their save function.
 * @return The card.
 */
export default function FirewallSettingsCard( { state, settings: data }: FirewallContext ) {
	const { settings, waf, save, isSaving } = data;
	const wafOn = Boolean( settings?.waf );
	const hasScan = Boolean( state?.hasScan );
	const rulesUsable = hasScan || Boolean( waf?.automatic_rules_available );
	const standalone = wafOn && Boolean( waf?.standalone_mode );

	let rulesNote = '';
	if ( ! hasScan ) {
		rulesNote = waf?.automatic_rules_available
			? __(
					'The free version of the firewall does not receive updates to automatic firewall rules.',
					'jetpack-protect-pkg'
				)
			: __(
					'The free version of the firewall only allows for use of manual rules.',
					'jetpack-protect-pkg'
				);
	}

	const onAutomaticRules = useCallback(
		( value: boolean ) => save( { [ AUTOMATIC_RULES ]: value } ),
		[ save ]
	);
	const onShareData = useCallback(
		( value: boolean ) =>
			save(
				value ? { [ SHARE_DATA ]: true } : { [ SHARE_DATA ]: false, [ SHARE_DEBUG_DATA ]: false },
				WAF_PATH
			),
		[ save ]
	);
	const onShareDebugData = useCallback(
		( value: boolean ) =>
			save(
				value
					? { [ SHARE_DEBUG_DATA ]: true, [ SHARE_DATA ]: true }
					: { [ SHARE_DEBUG_DATA ]: false },
				WAF_PATH
			),
		[ save ]
	);

	if ( state?.providedByHost ) {
		return <HostFirewallCard />;
	}

	if ( waf?.waf_supported === false ) {
		return (
			<ProtectCard icon={ shieldFlame } title={ __( 'Firewall', 'jetpack-protect-pkg' ) }>
				<CardRow>
					<Text variant="body-md">
						{ __( 'The firewall isn’t available on your site’s hosting.', 'jetpack-protect-pkg' ) }
					</Text>
				</CardRow>
			</ProtectCard>
		);
	}

	return (
		<ProtectCard
			icon={ shieldFlame }
			title={ __( 'Firewall', 'jetpack-protect-pkg' ) }
			status={
				standalone
					? { label: __( 'Standalone mode', 'jetpack-protect-pkg' ), intent: 'stable' }
					: undefined
			}
		>
			<div className="jp-protect-card__intro">
				<Text variant="body-md" render={ <p /> }>
					{ __( 'Block malicious requests before they reach your site.', 'jetpack-protect-pkg' ) }
				</Text>
			</div>
			<CardRow>
				<FirewallToggle data={ data } />
			</CardRow>
			<CardRow>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Automatic firewall rules', 'jetpack-protect-pkg' ) }
					help={ [
						__(
							'Rules for newly discovered attacks, kept up to date for you.',
							'jetpack-protect-pkg'
						),
						rulesNote,
					]
						.filter( Boolean )
						.join( ' ' ) }
					checked={ rulesUsable && Boolean( settings?.[ AUTOMATIC_RULES ] ) }
					disabled={ ! wafOn || ! rulesUsable || isSaving( AUTOMATIC_RULES ) }
					onChange={ onAutomaticRules }
				/>
			</CardRow>
			<CardRow>
				<Stack direction="column" gap="md">
					<SettingToggle
						data={ data }
						name={ enabledKey( IP_BLOCK_LIST ) }
						label={ __( 'Block these IP addresses', 'jetpack-protect-pkg' ) }
						help={ __(
							'Requests from these addresses never reach your site.',
							'jetpack-protect-pkg'
						) }
						disabled={ ! wafOn }
					/>
					{ wafOn && Boolean( settings?.[ enabledKey( IP_BLOCK_LIST ) ] ) && (
						<IpListField
							data={ data }
							name={ IP_BLOCK_LIST }
							label={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
						/>
					) }
				</Stack>
			</CardRow>
			<CardRow>
				<Stack direction="column" gap="md">
					<SettingToggle
						data={ data }
						name={ enabledKey( IP_ALLOW_LIST ) }
						label={ __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ) }
						help={ __(
							'Prevent Jetpack’s security features from blocking specific IP addresses.',
							'jetpack-protect-pkg'
						) }
						disabled={ ! wafOn }
					/>
					{ wafOn && Boolean( settings?.[ enabledKey( IP_ALLOW_LIST ) ] ) && (
						<IpListField
							data={ data }
							name={ IP_ALLOW_LIST }
							label={ __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ) }
							currentIp={ state?.currentIp }
						/>
					) }
				</Stack>
			</CardRow>
			<CardRow>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Share basic data with Jetpack', 'jetpack-protect-pkg' ) }
					help={ __(
						'Allow Jetpack to collect basic data from blocked requests to improve firewall protection and accuracy.',
						'jetpack-protect-pkg'
					) }
					checked={ Boolean( settings?.[ SHARE_DATA ] ) }
					disabled={ ! wafOn || isSaving( SHARE_DATA ) }
					onChange={ onShareData }
				/>
			</CardRow>
			<CardRow>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Share detailed data with Jetpack', 'jetpack-protect-pkg' ) }
					help={ __(
						'Allow Jetpack to collect detailed data from blocked requests to enhance firewall protection and accuracy.',
						'jetpack-protect-pkg'
					) }
					checked={ Boolean( settings?.[ SHARE_DEBUG_DATA ] ) }
					disabled={ ! wafOn || isSaving( SHARE_DEBUG_DATA ) }
					onChange={ onShareDebugData }
				/>
			</CardRow>
			{ wafOn && ( standalone || waf?.bootstrap_path ) && (
				<StandaloneModeRow bootstrapPath={ waf?.bootstrap_path ?? '' } standalone={ standalone } />
			) }
		</ProtectCard>
	);
}
