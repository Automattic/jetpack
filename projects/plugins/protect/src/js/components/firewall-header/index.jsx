import {
	AdminSectionHero,
	Container,
	Col,
	Text,
	H3,
	Button,
	useBreakpointMatch,
	StatCard,
	Status,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Spinner, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, help, shield, chartBar } from '@wordpress/icons';
import React, { useState, useCallback } from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const UpgradePrompt = () => {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const firewallUrl = adminUrl + '#/firewall';

	const {
		config: { automaticRulesAvailable },
	} = useWafData();

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: firewallUrl,
		useBlogIdSuffix: true,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_waf_header_get_scan_link_click', run );

	return (
		<Button className={ styles[ 'upgrade-button' ] } onClick={ getScan }>
			{ ! automaticRulesAvailable
				? __( 'Upgrade to enable automatic firewall protection', 'jetpack-protect' )
				: __(
						'Upgrade to update automatic security rules',
						'jetpack-protect',
						/* dummy arg to avoid bad minification */ 0
				  ) }
		</Button>
	);
};

const FirewallSubheadingPopover = ( {
	children = __(
		'The free version of the firewall does not receive updates to automatic security rules.',
		'jetpack-protect'
	),
} ) => {
	const [ showPopover, setShowPopover ] = useState( false );

	const handleEnter = useCallback( () => {
		setShowPopover( true );
	}, [] );

	const handleOut = useCallback( () => {
		setShowPopover( false );
	}, [] );

	return (
		<div
			className={ styles[ 'icon-popover' ] }
			onMouseLeave={ handleOut }
			onMouseEnter={ handleEnter }
			onClick={ handleEnter }
			onFocus={ handleEnter }
			onBlur={ handleOut }
			role="presentation"
		>
			<Icon icon={ help } />
			{ showPopover && (
				<Popover noArrow={ false } offset={ 5 } inline={ true }>
					<Text className={ styles[ 'popover-text' ] } variant={ 'body-small' }>
						{ children }
					</Text>
				</Popover>
			) }
		</div>
	);
};

const FirewallSubheadingContent = ( { className, text = '', popover = false, children } ) => {
	return (
		<div className={ styles[ 'firewall-subheading__content' ] }>
			<Text className={ styles[ className ] } weight={ 600 }>
				{ text }
			</Text>
			{ popover && <FirewallSubheadingPopover children={ children } /> }
		</div>
	);
};

const FirewallSubheading = ( {
	hasRequiredPlan,
	automaticRulesAvailable,
	jetpackWafIpList,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
	wafSupported,
} ) => {
	const allRules = wafSupported && jetpackWafAutomaticRules && jetpackWafIpList;
	const automaticRules = wafSupported && jetpackWafAutomaticRules && ! jetpackWafIpList;
	const manualRules = wafSupported && ! jetpackWafAutomaticRules && jetpackWafIpList;
	const noRules = wafSupported && ! jetpackWafAutomaticRules && ! jetpackWafIpList;

	return (
		<>
			<div className={ styles[ 'firewall-subheading' ] }>
				{ wafSupported && bruteForceProtectionIsEnabled && (
					<FirewallSubheadingContent
						className={ 'brute-force-protection-subheading' }
						text={ __( 'Brute force protection is active.', 'jetpack-protect' ) }
					/>
				) }
				{ noRules && (
					<FirewallSubheadingContent
						text={ __( 'There are no firewall rules applied.', 'jetpack-protect' ) }
					/>
				) }
				{ automaticRules && (
					<FirewallSubheadingContent
						text={ __( 'Automatic firewall protection is enabled.', 'jetpack-protect' ) }
						popover={ ! hasRequiredPlan }
					/>
				) }
				{ manualRules && (
					<FirewallSubheadingContent
						text={ __( 'Only manual IP list rules apply.', 'jetpack-protect' ) }
						popover={ ! hasRequiredPlan && ! automaticRulesAvailable }
						children={ __(
							'The free version of the firewall only allows for use of manual rules.',
							'jetpack-protect'
						) }
					/>
				) }
				{ allRules && (
					<FirewallSubheadingContent
						text={ __( 'All firewall rules apply.', 'jetpack-protect' ) }
						popover={ ! hasRequiredPlan }
					/>
				) }
			</div>
			{ ! hasRequiredPlan && <UpgradePrompt /> }
		</>
	);
};

const FirewallHeader = ( {
	status,
	hasRequiredPlan,
	automaticRulesEnabled,
	automaticRulesAvailable,
	jetpackWafIpList,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
	wafSupported,
	oneDayStats,
	thirtyDayStats,
	jetpackWafShareData,
	standaloneMode,
} ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	// TODO: Fix mobile display when value is too large
	const oneDayArgs = {
		className: ! hasRequiredPlan || ! jetpackWafShareData ? styles.disabled : styles.active,
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ shield } />
				{ ! isSmall && ! hasRequiredPlan && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</span>
		),
		label: isSmall ? (
			<span>{ __( 'Blocked requests last 24 hours', 'jetpack-protect' ) }</span>
		) : (
			<span className={ styles[ 'stat-card-label' ] }>
				<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
				<br />
				<span>{ __( 'Last 24 hours', 'jetpack-protect' ) }</span>
			</span>
		),
		value: hasRequiredPlan ? oneDayStats : 0,
		variant: isSmall ? 'horizontal' : 'square',
	};

	// TODO: Fix mobile display when value is too large
	const thirtyDayArgs = {
		className: ! hasRequiredPlan || ! jetpackWafShareData ? styles.disabled : styles.active,
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ chartBar } />
				{ ! isSmall && ! hasRequiredPlan && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</span>
		),
		label: isSmall ? (
			<span>{ __( 'Blocked requests last 30 days', 'jetpack-protect' ) }</span>
		) : (
			<span className={ styles[ 'stat-card-label' ] }>
				<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
				<br />
				<span>{ __( 'Last 30 days', 'jetpack-protect' ) }</span>
			</span>
		),
		value: hasRequiredPlan ? thirtyDayStats : 0,
		variant: isSmall ? 'horizontal' : 'square',
	};

	return (
		<AdminSectionHero>
			<Container
				className={ styles[ 'firewall-header' ] }
				horizontalSpacing={ 7 }
				horizontalGap={ 0 }
			>
				<Col>
					{ 'on' === status && (
						<>
							<Status
								status="active"
								label={
									standaloneMode
										? __( 'Standalone mode', 'jetpack-protect' )
										: __( 'Active', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 )
								}
							/>{ ' ' }
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 1 } mt={ 2 }>
								{ ! wafSupported && __( 'Brute force protection is active', 'jetpack-protect' ) }
								{ wafSupported &&
									( automaticRulesEnabled
										? __( 'Automatic firewall is on', 'jetpack-protect' )
										: __(
												'Firewall is on',
												'jetpack-protect',
												/* dummy arg to avoid bad minification */ 0
										  ) ) }
							</H3>
							<FirewallSubheading
								jetpackWafIpList={ jetpackWafIpList }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasRequiredPlan={ hasRequiredPlan }
								automaticRulesAvailable={ automaticRulesAvailable }
								wafSupported={ wafSupported }
							/>
						</>
					) }
					{ 'off' === status && (
						<>
							<Status status="inactive" label={ __( 'Inactive', 'jetpack-protect' ) } />
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 1 } mt={ 2 }>
								{ ! wafSupported && __( 'Brute force protection is disabled', 'jetpack-protect' ) }
								{ wafSupported &&
									( automaticRulesAvailable
										? __( 'Automatic firewall is off', 'jetpack-protect' )
										: __(
												'Firewall is off',
												'jetpack-protect',
												/* dummy arg to avoid bad minification */ 0
										  ) ) }
							</H3>
							<FirewallSubheading
								jetpackWafIpList={ jetpackWafIpList }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasRequiredPlan={ hasRequiredPlan }
								automaticRulesAvailable={ automaticRulesAvailable }
								wafSupported={ wafSupported }
							/>
						</>
					) }
					{ 'loading' === status && (
						<>
							<Spinner className={ styles.spinner } />
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
								{ __( 'Automatic firewall is being set up', 'jetpack-protect' ) }
							</H3>
							<Text className={ styles[ 'loading-text' ] } weight={ 600 }>
								{ __( 'Please wait…', 'jetpack-protect' ) }
							</Text>
						</>
					) }
				</Col>
				<Col>
					{ wafSupported && (
						<div className={ styles[ 'stat-card-wrapper' ] }>
							<StatCard { ...oneDayArgs } />
							<StatCard { ...thirtyDayArgs } />
						</div>
					) }
				</Col>
			</Container>
		</AdminSectionHero>
	);
};

const ConnectedFirewallHeader = () => {
	const {
		config: {
			jetpackWafAutomaticRules,
			jetpackWafIpList,
			standaloneMode,
			automaticRulesAvailable,
			bruteForceProtection,
			jetpackWafShareData,
		},
		isToggling,
		wafSupported,
		stats,
		isEnabled,
	} = useWafData();
	const { hasRequiredPlan } = useProtectData();
	const isSupportedWafFeatureEnabled = wafSupported ? isEnabled : bruteForceProtection;
	const currentStatus = isSupportedWafFeatureEnabled ? 'on' : 'off';
	const { oneDayStats, thirtyDayStats } =
		stats && stats.blockedRequests ? stats.blockedRequests : { oneDayStats: 0, thirtyDayStats: 0 };

	return (
		<FirewallHeader
			status={ isToggling ? 'loading' : currentStatus }
			hasRequiredPlan={ hasRequiredPlan }
			automaticRulesEnabled={ jetpackWafAutomaticRules }
			automaticRulesAvailable={ automaticRulesAvailable }
			jetpackWafIpList={ jetpackWafIpList }
			jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
			bruteForceProtectionIsEnabled={ bruteForceProtection }
			wafSupported={ wafSupported }
			oneDayStats={ oneDayStats }
			thirtyDayStats={ thirtyDayStats }
			jetpackWafShareData={ jetpackWafShareData }
			standaloneMode={ standaloneMode }
		/>
	);
};

export { FirewallHeader };

export default ConnectedFirewallHeader;
