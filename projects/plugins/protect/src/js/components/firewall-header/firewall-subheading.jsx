import { Text, Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import IconTooltip from '../icon-tooltip';
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
	hasPlan,
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
			{ ! hasPlan && <UpgradePrompt automaticRulesAvailable={ automaticRulesAvailable } /> }
		</>
	);
};

export default FirewallSubheading;
