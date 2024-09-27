import { Text, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import { useWafData } from '../../hooks/use-waf-data';
import IconTooltip from '../icon-tooltip';
import styles from './styles.module.scss';

const UpgradePrompt = () => {
	const { recordEvent } = useAnalyticsTracks();
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const firewallUrl = adminUrl + '#/firewall';
	const { upgradePlan } = usePlan( { redirectUrl: firewallUrl } );

	const {
		config: { automaticRulesAvailable },
	} = useWafData();

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_waf_header_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

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

const FirewallSubheadingContent = ( { className, text = '', popover = false } ) => {
	return (
		<div className={ styles[ 'firewall-subheading__content' ] }>
			<Text className={ styles[ className ] } weight={ 600 }>
				{ text }
			</Text>
			{ popover && (
				<IconTooltip
					icon={ help }
					text={ __(
						'The free version of the firewall does not receive updates to automatic security rules.',
						'jetpack-protect'
					) }
				/>
			) }
		</div>
	);
};

const FirewallSubheading = ( {
	jetpackWafIpBlockListEnabled,
	jetpackWafIpAllowListEnabled,
	hasPlan,
	automaticRulesAvailable,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
	wafSupported,
} ) => {
	const allowOrBlockListEnabled = jetpackWafIpBlockListEnabled || jetpackWafIpAllowListEnabled;
	const allRules = wafSupported && jetpackWafAutomaticRules && allowOrBlockListEnabled;
	const automaticRules = wafSupported && jetpackWafAutomaticRules && ! allowOrBlockListEnabled;
	const manualRules = wafSupported && ! jetpackWafAutomaticRules && allowOrBlockListEnabled;
	const noRules = wafSupported && ! jetpackWafAutomaticRules && ! allowOrBlockListEnabled;

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
						popover={ ! hasPlan }
					/>
				) }
				{ manualRules && (
					<FirewallSubheadingContent
						text={ __( 'Only manual IP list rules apply.', 'jetpack-protect' ) }
						popover={ ! hasPlan && ! automaticRulesAvailable }
						children={ __(
							'The free version of the firewall only allows for use of manual rules.',
							'jetpack-protect'
						) }
					/>
				) }
				{ allRules && (
					<FirewallSubheadingContent
						text={ __( 'All firewall rules apply.', 'jetpack-protect' ) }
						popover={ ! hasPlan }
					/>
				) }
			</div>
			{ ! hasPlan && wafSupported && <UpgradePrompt /> }
		</>
	);
};

export default FirewallSubheading;
