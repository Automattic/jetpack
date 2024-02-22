import { Text, Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, help } from '@wordpress/icons';
import React, { useState, useCallback } from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import styles from './styles.module.scss';

const UpgradePrompt = ( { automaticRulesAvailable } ) => {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const firewallUrl = adminUrl + '#/firewall';

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
			{ ! hasRequiredPlan && <UpgradePrompt automaticRulesAvailable={ automaticRulesAvailable } /> }
		</>
	);
};

export default FirewallSubheading;
