import { AdminSectionHero, Container, Col, Text, H3, Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Spinner, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, help } from '@wordpress/icons';
import classnames from 'classnames';
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
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_waf_header_get_scan_link_click', run );

	return (
		<Button className={ styles[ 'upgrade-button' ] } onClick={ getScan }>
			{ ! automaticRulesAvailable
				? __( 'Upgrade to enable automatic rules', 'jetpack-protect' )
				: __(
						'Upgrade to update automatic rules',
						'jetpack-protect',
						/* dummy arg to avoid bad minification */ 0
				  ) }
		</Button>
	);
};

const FirewallSubheadingPopover = ( { children } ) => {
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
				<Popover noArrow={ false } offset={ 5 }>
					<Text className={ styles[ 'popover-text' ] } variant={ 'body-small' }>
						{ children }
					</Text>
				</Popover>
			) }
		</div>
	);
};

const AutomaticRulesText = ( { popover = false } ) => {
	return (
		<div className={ styles[ 'rules-subheading' ] }>
			<Text weight={ 600 }>{ __( 'Only automatic rules apply.', 'jetpack-protect' ) }</Text>
			{ popover && (
				<FirewallSubheadingPopover
					children={ __(
						'The free version of the firewall does not receive updates to automatic firewall rules.',
						'jetpack-protect'
					) }
				/>
			) }
		</div>
	);
};

const ManualRulesText = ( { popover = false } ) => {
	return (
		<div className={ styles[ 'rules-subheading' ] }>
			<Text weight={ 600 }>{ __( 'Only manual rules apply.', 'jetpack-protect' ) }</Text>
			{ popover && (
				<FirewallSubheadingPopover
					children={ __(
						'The free version of the firewall only allows for use of manual rules.',
						'jetpack-protect'
					) }
				/>
			) }
		</div>
	);
};

const AllRulesText = ( { popover = false } ) => {
	return (
		<div className={ styles[ 'rules-subheading' ] }>
			<Text weight={ 600 }>{ __( 'All rules apply.', 'jetpack-protect' ) }</Text>
			{ popover && (
				<FirewallSubheadingPopover
					children={ __(
						'The free version of the firewall does not receive updates to automatic firewall rules.',
						'jetpack-protect'
					) }
				/>
			) }
		</div>
	);
};

const FirewallSubheading = ( {
	hasRequiredPlan,
	automaticRulesAvailable,
	jetpackWafIpList,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
} ) => {
	const noRulesText = (
		<Text weight={ 600 }>{ __( 'There are no firewall rules applied.', 'jetpack-protect' ) }</Text>
	);

	const bruteForceProtectionText = (
		<Text className={ styles[ 'brute-force-protection-subheading' ] } weight={ 600 }>
			{ __( 'Brute force protection is active.', 'jetpack-protect' ) }
		</Text>
	);

	return (
		<>
			<div className={ styles[ 'firewall-subheading' ] }>
				{ bruteForceProtectionIsEnabled && bruteForceProtectionText }
				{ hasRequiredPlan ? (
					<>
						{ jetpackWafAutomaticRules && jetpackWafIpList && <AllRulesText /> }
						{ jetpackWafAutomaticRules && ! jetpackWafIpList && <AutomaticRulesText /> }
						{ ! jetpackWafAutomaticRules && jetpackWafIpList && <ManualRulesText /> }
						{ ! jetpackWafAutomaticRules && ! jetpackWafIpList && noRulesText }
					</>
				) : (
					<>
						{ automaticRulesAvailable ? (
							<>
								{ jetpackWafAutomaticRules && jetpackWafIpList && (
									<AllRulesText popover={ true } />
								) }
								{ jetpackWafAutomaticRules && ! jetpackWafIpList && (
									<AutomaticRulesText popover={ true } />
								) }
								{ ! jetpackWafAutomaticRules && jetpackWafIpList && <ManualRulesText /> }
								{ ! jetpackWafAutomaticRules && ! jetpackWafIpList && noRulesText }
							</>
						) : (
							<>
								{ jetpackWafIpList && <ManualRulesText popover={ true } /> }
								{ ! jetpackWafIpList && noRulesText }
							</>
						) }
					</>
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
} ) => {
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
							<Text className={ classnames( styles.status, styles.active ) } variant={ 'label' }>
								{ __( 'Active', 'jetpack-protect' ) }
							</Text>
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 1 } mt={ 2 }>
								{ automaticRulesEnabled
									? __( 'Automatic firewall is on', 'jetpack-protect' )
									: __(
											'Firewall is on',
											'jetpack-protect',
											/* dummy arg to avoid bad minification */ 0
									  ) }
							</H3>
							<FirewallSubheading
								jetpackWafIpList={ jetpackWafIpList }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasRequiredPlan={ hasRequiredPlan }
								automaticRulesAvailable={ automaticRulesAvailable }
							/>
						</>
					) }
					{ 'off' === status && (
						<>
							<Text className={ styles.status } variant={ 'label' }>
								{ __( 'Inactive', 'jetpack-protect' ) }
							</Text>
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
								{ automaticRulesAvailable
									? __( 'Automatic firewall is off', 'jetpack-protect' )
									: __(
											'Firewall is off',
											'jetpack-protect',
											/* dummy arg to avoid bad minification */ 0
									  ) }
							</H3>
							<FirewallSubheading
								jetpackWafIpList={ jetpackWafIpList }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasRequiredPlan={ hasRequiredPlan }
								automaticRulesAvailable={ automaticRulesAvailable }
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
					<div className={ styles[ 'stat-card-wrapper' ] }></div>
				</Col>
			</Container>
		</AdminSectionHero>
	);
};

const ConnectedFirewallHeader = () => {
	const {
		config: { jetpackWafAutomaticRules, jetpackWafIpList, automaticRulesAvailable },
		isToggling,
		bruteForceProtectionIsEnabled,
	} = useWafData();
	const { hasRequiredPlan } = useProtectData();
	const currentStatus = jetpackWafAutomaticRules || jetpackWafIpList ? 'on' : 'off';

	return (
		<FirewallHeader
			status={ isToggling ? 'loading' : currentStatus }
			hasRequiredPlan={ hasRequiredPlan }
			automaticRulesEnabled={ jetpackWafAutomaticRules }
			automaticRulesAvailable={ automaticRulesAvailable }
			jetpackWafIpList={ jetpackWafIpList }
			jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
			bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
		/>
	);
};

export { FirewallHeader };

export default ConnectedFirewallHeader;
