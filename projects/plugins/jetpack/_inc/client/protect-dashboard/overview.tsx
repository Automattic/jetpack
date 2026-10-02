import { siteScanQuery } from '@automattic/jetpack-scan-page/src/js/data/query-options';
import { useQuery } from '@tanstack/react-query';
import { Button, Notice, Spinner, TextareaControl } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { key, lock, people, scheduled, search, shield } from '@wordpress/icons';
import {
	getFirewallBlocks,
	getSiteCounts,
	moduleDataQuery,
	modulesQuery,
	settingsQuery,
	useToggleModule,
	useUpdateSettings,
	useUpdateWaf,
	wafQuery,
} from './data';
import { BoxRow, SecurityBox, StatGrid, ToggleRow } from './security-box';
import type { WafConfig } from './data';
import type { ProtectTab } from './index';
import type { FC } from 'react';

type NavProps = {
	onNavigate: ( tab: ProtectTab ) => void;
};

/**
 * Hook for one module's on/off state and its toggle.
 *
 * @param module - Module slug.
 * @return The state and a setter.
 */
function useModule( module: string ) {
	const { data: modules } = useQuery( modulesQuery() );
	const toggle = useToggleModule();
	const info = modules?.[ module ];
	return {
		active: !! info?.activated,
		// Hosts can force a module on or off; the toggle can't change that.
		locked: ! info || info.available === false || !! info.override,
		pending: toggle.isPending && toggle.variables?.module === module,
		setActive: ( active: boolean ) => toggle.mutate( { module, active } ),
	};
}

const ScanBox: FC< NavProps > = ( { onNavigate } ) => {
	const { data, isLoading, isError } = useQuery( { ...siteScanQuery(), retry: false } );
	const counts = getSiteCounts();
	const goToScan = useCallback( () => onNavigate( 'scan' ), [ onNavigate ] );

	if ( isLoading ) {
		return (
			<SecurityBox icon={ search } title={ __( 'Scan', 'jetpack' ) }>
				<BoxRow>
					<Spinner />
				</BoxRow>
			</SecurityBox>
		);
	}

	const available = ! isError && !! data && data.state !== 'unavailable';
	const threats = data?.threats?.length ?? 0;
	const lastScan = data?.mostRecent?.timestamp
		? new Date( data.mostRecent.timestamp ).toLocaleDateString( undefined, { dateStyle: 'medium' } )
		: __( 'Not yet', 'jetpack' );

	const covered = [
		{ label: __( 'Plugins checked', 'jetpack' ), value: counts.plugins },
		{ label: __( 'Themes checked', 'jetpack' ), value: counts.themes },
		{
			label: __( 'WordPress core', 'jetpack' ),
			value: counts.wpVersion ? `v${ counts.wpVersion }` : '—',
		},
	];

	return (
		<SecurityBox
			icon={ search }
			title={ __( 'Scan', 'jetpack' ) }
			badge={ available ? __( 'Daily', 'jetpack' ) : __( 'Not in plan', 'jetpack' ) }
			description={ __(
				'Checks your plugins, themes, core files and database for malware and known vulnerabilities.',
				'jetpack'
			) }
		>
			<BoxRow>
				{ available ? (
					<StatGrid
						stats={ [
							{
								label: __( 'Active threats', 'jetpack' ),
								value: threats,
								tone: threats ? 'warning' : 'ok',
							},
							{ label: __( 'Last scan', 'jetpack' ), value: lastScan },
							...covered,
						] }
					/>
				) : (
					<>
						<StatGrid stats={ covered } />
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Upgrade to scan these daily for malware and vulnerabilities, with one-click fixes.',
								'jetpack'
							) }
						</Notice>
					</>
				) }
			</BoxRow>
			{ available && (
				<BoxRow>
					<div className="jp-protect-box__actions">
						<Button variant="tertiary" onClick={ goToScan }>
							{ threats
								? sprintf(
										/* translators: %d is the number of active threats. */
										_n( 'Review %d threat', 'Review %d threats', threats, 'jetpack' ),
										threats
									)
								: __( 'View scan history', 'jetpack' ) }
						</Button>
					</div>
				</BoxRow>
			) }
		</SecurityBox>
	);
};

type IpLists = Pick<
	WafConfig,
	| 'jetpack_waf_ip_allow_list'
	| 'jetpack_waf_ip_allow_list_enabled'
	| 'jetpack_waf_ip_block_list'
	| 'jetpack_waf_ip_block_list_enabled'
>;

const FirewallBox: FC = () => {
	const firewall = useModule( 'waf' );
	const { data: waf } = useQuery( wafQuery() );
	const updateWaf = useUpdateWaf();
	const [ lists, setLists ] = useState< IpLists | null >( null );

	useEffect( () => {
		if ( waf ) {
			// The API returns `false` for an empty list.
			setLists( {
				jetpack_waf_ip_allow_list: waf.jetpack_waf_ip_allow_list || '',
				jetpack_waf_ip_allow_list_enabled: !! waf.jetpack_waf_ip_allow_list_enabled,
				jetpack_waf_ip_block_list: waf.jetpack_waf_ip_block_list || '',
				jetpack_waf_ip_block_list_enabled: !! waf.jetpack_waf_ip_block_list_enabled,
			} );
		}
	}, [ waf ] );

	const onAutomaticRules = useCallback(
		( value: boolean ) => updateWaf.mutate( { jetpack_waf_automatic_rules: value } ),
		[ updateWaf ]
	);
	const setList = useCallback(
		< K extends keyof IpLists >( field: K, value: IpLists[ K ] ) =>
			setLists( prev => ( prev ? { ...prev, [ field ]: value } : prev ) ),
		[]
	);
	const onAllowEnabled = useCallback(
		( value: boolean ) => setList( 'jetpack_waf_ip_allow_list_enabled', value ),
		[ setList ]
	);
	const onAllowList = useCallback(
		( value: string ) => setList( 'jetpack_waf_ip_allow_list', value ),
		[ setList ]
	);
	const onBlockEnabled = useCallback(
		( value: boolean ) => setList( 'jetpack_waf_ip_block_list_enabled', value ),
		[ setList ]
	);
	const onBlockList = useCallback(
		( value: string ) => setList( 'jetpack_waf_ip_block_list', value ),
		[ setList ]
	);
	const onSaveLists = useCallback( () => lists && updateWaf.mutate( lists ), [ lists, updateWaf ] );

	const supported = waf?.waf_supported !== false;
	const blocks = getFirewallBlocks();
	const rulesUpdated = Number( waf?.automatic_rules_last_updated ) || 0;

	return (
		<SecurityBox
			icon={ shield }
			title={ __( 'Firewall', 'jetpack' ) }
			description={ __( 'Block malicious requests before they reach your site.', 'jetpack' ) }
		>
			{ ! supported && (
				<BoxRow>
					<Notice status="warning" isDismissible={ false }>
						{ __( 'Your host does not support the firewall.', 'jetpack' ) }
					</Notice>
				</BoxRow>
			) }
			{ firewall.active && (
				<BoxRow>
					<StatGrid
						stats={ [
							{
								label: __( 'Blocked today', 'jetpack' ),
								value: ( blocks?.current_day ?? 0 ).toLocaleString(),
								tone: 'ok',
							},
							{
								label: __( 'Blocked in the last 30 days', 'jetpack' ),
								value: ( blocks?.thirty_days ?? 0 ).toLocaleString(),
								tone: 'ok',
							},
							{
								label: __( 'Blocked all time', 'jetpack' ),
								value: ( blocks?.all_time ?? 0 ).toLocaleString(),
								tone: 'ok',
							},
							{
								label: __( 'Rules last updated', 'jetpack' ),
								value: rulesUpdated
									? new Date( rulesUpdated * 1000 ).toLocaleDateString( undefined, {
											dateStyle: 'medium',
										} )
									: __( 'Not yet', 'jetpack' ),
							},
						] }
					/>
				</BoxRow>
			) }
			<ToggleRow
				label={ __( 'Enable the firewall', 'jetpack' ) }
				help={ __( 'Inspects every request against Jetpack’s firewall rules.', 'jetpack' ) }
				checked={ firewall.active }
				disabled={ firewall.locked || firewall.pending || ! supported }
				onChange={ firewall.setActive }
			/>
			<ToggleRow
				label={ __( 'Automatic firewall rules', 'jetpack' ) }
				help={ __( 'Rules for newly discovered attacks, kept up to date for you.', 'jetpack' ) }
				checked={ !! waf?.jetpack_waf_automatic_rules }
				disabled={ ! firewall.active || updateWaf.isPending }
				onChange={ onAutomaticRules }
			/>
			{ lists && (
				<>
					<ToggleRow
						label={ __( 'Always allow these IP addresses', 'jetpack' ) }
						help={ __( 'Never blocked by the firewall or brute force protection.', 'jetpack' ) }
						checked={ lists.jetpack_waf_ip_allow_list_enabled }
						onChange={ onAllowEnabled }
					>
						{ lists.jetpack_waf_ip_allow_list_enabled && (
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Allowed IP addresses, one per line', 'jetpack' ) }
								value={ lists.jetpack_waf_ip_allow_list }
								onChange={ onAllowList }
							/>
						) }
					</ToggleRow>
					<ToggleRow
						label={ __( 'Always block these IP addresses', 'jetpack' ) }
						help={ __( 'Requests from these addresses never reach your site.', 'jetpack' ) }
						checked={ lists.jetpack_waf_ip_block_list_enabled }
						disabled={ ! firewall.active }
						onChange={ onBlockEnabled }
					>
						{ lists.jetpack_waf_ip_block_list_enabled && (
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Blocked IP addresses, one per line', 'jetpack' ) }
								value={ lists.jetpack_waf_ip_block_list }
								onChange={ onBlockList }
							/>
						) }
					</ToggleRow>
					<BoxRow>
						<Button
							variant="secondary"
							isBusy={ updateWaf.isPending }
							disabled={ updateWaf.isPending }
							onClick={ onSaveLists }
						>
							{ __( 'Save IP lists', 'jetpack' ) }
						</Button>
						{ updateWaf.isError && (
							<Notice status="error" isDismissible={ false }>
								{ __( 'Could not save the firewall settings.', 'jetpack' ) }
							</Notice>
						) }
					</BoxRow>
				</>
			) }
		</SecurityBox>
	);
};

const BruteForceBox: FC = () => {
	const bruteForce = useModule( 'protect' );
	const { data: blocked, isLoading } = useQuery( {
		...moduleDataQuery< number >( 'protect' ),
		enabled: bruteForce.active,
	} );

	return (
		<SecurityBox
			icon={ lock }
			title={ __( 'Brute force protection', 'jetpack' ) }
			description={ __( 'Stop bots from guessing their way into your site.', 'jetpack' ) }
		>
			<ToggleRow
				label={ __( 'Block repeated failed logins', 'jetpack' ) }
				help={ __( 'IPs with too many failed login attempts are blocked.', 'jetpack' ) }
				checked={ bruteForce.active }
				disabled={ bruteForce.locked || bruteForce.pending }
				onChange={ bruteForce.setActive }
			/>
			{ bruteForce.active && (
				<BoxRow>
					<StatGrid
						stats={ [
							{
								label: __( 'Malicious login attempts blocked', 'jetpack' ),
								value: isLoading ? '…' : Number( blocked ?? 0 ).toLocaleString(),
								tone: 'ok',
							},
						] }
					/>
				</BoxRow>
			) }
		</SecurityBox>
	);
};

const AccountProtectionBox: FC = () => {
	const accounts = useModule( 'account-protection' );
	return (
		<SecurityBox
			icon={ people }
			title={ __( 'Account protection', 'jetpack' ) }
			description={ __(
				'Keep administrator and editor accounts out of attackers’ hands.',
				'jetpack'
			) }
		>
			<ToggleRow
				label={ __( 'Protect privileged accounts', 'jetpack' ) }
				help={ __(
					'Requires strong passwords and emails a code to verify suspicious logins.',
					'jetpack'
				) }
				checked={ accounts.active }
				disabled={ accounts.locked || accounts.pending }
				onChange={ accounts.setActive }
			/>
		</SecurityBox>
	);
};

type SettingToggleRowProps = {
	setting: string;
	label: string;
	help?: string;
};

/**
 * A toggle bound to one boolean Jetpack setting.
 *
 * @param props         - Component props.
 * @param props.setting - The `jetpack/v4/settings` key.
 * @param props.label   - Setting name.
 * @param props.help    - Setting description.
 * @return The row.
 */
const SettingToggleRow: FC< SettingToggleRowProps > = ( { setting, label, help } ) => {
	const { data: settings } = useQuery( settingsQuery() );
	const updateSettings = useUpdateSettings();
	const onChange = useCallback(
		( value: boolean ) => updateSettings.mutate( { [ setting ]: value } ),
		[ setting, updateSettings ]
	);

	return (
		<ToggleRow
			label={ label }
			help={ help }
			checked={ !! settings?.[ setting ] }
			disabled={ ! settings || updateSettings.isPending }
			onChange={ onChange }
		/>
	);
};

const MonitorBox: FC = () => {
	const monitor = useModule( 'monitor' );
	const { data: downtime, isLoading } = useQuery( {
		...moduleDataQuery< { date: string | null } >( 'monitor' ),
		enabled: monitor.active,
	} );

	let lastDowntime: string;
	if ( isLoading ) {
		lastDowntime = '…';
	} else if ( downtime?.date ) {
		/* translators: %s is a human-readable duration, e.g. "3 days". */
		lastDowntime = sprintf( __( '%s ago', 'jetpack' ), downtime.date );
	} else {
		lastDowntime = __( 'None recorded', 'jetpack' );
	}

	return (
		<SecurityBox
			icon={ scheduled }
			title={ __( 'Downtime monitoring', 'jetpack' ) }
			description={ __(
				'Jetpack checks your site every five minutes and tells you when it goes down.',
				'jetpack'
			) }
		>
			<ToggleRow
				label={ __( 'Monitor site uptime', 'jetpack' ) }
				checked={ monitor.active }
				disabled={ monitor.locked || monitor.pending }
				onChange={ monitor.setActive }
			/>
			{ monitor.active && (
				<>
					<SettingToggleRow
						setting="monitor_receive_notifications"
						label={ __( 'Email me when my site goes down', 'jetpack' ) }
						help={ __( 'Sent to your WordPress.com account email.', 'jetpack' ) }
					/>
					<BoxRow>
						<StatGrid
							stats={ [
								{
									label: __( 'Status', 'jetpack' ),
									value: __( 'Monitoring', 'jetpack' ),
									tone: 'ok',
								},
								{ label: __( 'Last downtime', 'jetpack' ), value: lastDowntime },
							] }
						/>
					</BoxRow>
				</>
			) }
		</SecurityBox>
	);
};

const SsoBox: FC = () => {
	const sso = useModule( 'sso' );

	return (
		<SecurityBox
			icon={ key }
			title={ __( 'Secure sign-on', 'jetpack' ) }
			description={ __( 'Log in with WordPress.com and its two-step authentication.', 'jetpack' ) }
		>
			<ToggleRow
				label={ __( 'Allow logging in with WordPress.com', 'jetpack' ) }
				checked={ sso.active }
				disabled={ sso.locked || sso.pending }
				onChange={ sso.setActive }
			/>
			{ sso.active && (
				<>
					<SettingToggleRow
						setting="jetpack_sso_match_by_email"
						label={ __( 'Match accounts by email', 'jetpack' ) }
						help={ __(
							'Link WordPress.com accounts to users with the same email address.',
							'jetpack'
						) }
					/>
					<SettingToggleRow
						setting="jetpack_sso_require_two_step"
						label={ __( 'Require two-step authentication', 'jetpack' ) }
						help={ __(
							'Only allow WordPress.com logins that use two-step authentication.',
							'jetpack'
						) }
					/>
				</>
			) }
		</SecurityBox>
	);
};

/**
 * Overview: one box per security feature, with its settings inline.
 *
 * @param props            - Component props.
 * @param props.onNavigate - Switches the dashboard tab.
 * @return The Overview tab.
 */
const Overview: FC< NavProps > = ( { onNavigate } ) => {
	const { isLoading, isError } = useQuery( modulesQuery() );

	if ( isLoading ) {
		return <Spinner />;
	}
	if ( isError ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ __( 'Could not load your security settings.', 'jetpack' ) }
			</Notice>
		);
	}

	return (
		<div className="jp-protect-dashboard__boxes">
			<ScanBox onNavigate={ onNavigate } />
			<FirewallBox />
			<BruteForceBox />
			<AccountProtectionBox />
			<MonitorBox />
			<SsoBox />
		</div>
	);
};

export default Overview;
