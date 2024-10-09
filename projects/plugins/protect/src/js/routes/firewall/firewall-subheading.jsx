import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';
import { useMemo } from 'react';
import IconTooltip from '../../components/icon-tooltip';
import FirewallUpgradePrompt from './firewall-upgrade-prompt';
import styles from './styles.module.scss';

const FirewallSubheading = ( {
	jetpackWafIpBlockListEnabled,
	jetpackWafIpAllowListEnabled,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
	hasPlan,
	automaticRulesAvailable,
	wafSupported,
} ) => {
	const allowOrBlockListEnabled = useMemo(
		() => jetpackWafIpBlockListEnabled || jetpackWafIpAllowListEnabled,
		[ jetpackWafIpBlockListEnabled, jetpackWafIpAllowListEnabled ]
	);

	const allRules = useMemo(
		() => wafSupported && jetpackWafAutomaticRules && allowOrBlockListEnabled,
		[ wafSupported, jetpackWafAutomaticRules, allowOrBlockListEnabled ]
	);

	const automaticRules = useMemo(
		() => wafSupported && jetpackWafAutomaticRules && ! allowOrBlockListEnabled,
		[ wafSupported, jetpackWafAutomaticRules, allowOrBlockListEnabled ]
	);

	const manualRules = useMemo(
		() => wafSupported && ! jetpackWafAutomaticRules && allowOrBlockListEnabled,
		[ wafSupported, jetpackWafAutomaticRules, allowOrBlockListEnabled ]
	);

	const noRules = useMemo(
		() => wafSupported && ! jetpackWafAutomaticRules && ! allowOrBlockListEnabled,
		[ wafSupported, jetpackWafAutomaticRules, allowOrBlockListEnabled ]
	);

	const content = useMemo( () => {
		const textSegments = [];

		if ( wafSupported && bruteForceProtectionIsEnabled ) {
			textSegments.push( __( 'Brute force protection is active.', 'jetpack-protect' ) );
		}

		if ( noRules ) {
			textSegments.push( __( 'There are no firewall rules applied.', 'jetpack-protect' ) );
		}

		if ( automaticRules ) {
			textSegments.push( __( 'Automatic firewall rules apply.', 'jetpack-protect' ) );
		}

		if ( manualRules ) {
			textSegments.push( __( 'Only manual IP list rules apply.', 'jetpack-protect' ) );
		}

		if ( allRules ) {
			textSegments.push( __( 'All firewall rules apply.', 'jetpack-protect' ) );
		}

		return textSegments.join( ' ' );
	}, [
		wafSupported,
		bruteForceProtectionIsEnabled,
		noRules,
		automaticRules,
		manualRules,
		allRules,
	] );

	const tooltipText = useMemo( () => {
		return ! automaticRulesAvailable
			? __(
					'The free version of the firewall only allows for use of manual rules.',
					'jetpack-protect'
			  )
			: __(
					'The free version of the firewall does not receive updates to automatic security rules.',
					'jetpack-protect',
					/* dummy arg to avoid bad minification */ 0
			  );
	}, [ automaticRulesAvailable ] );

	return (
		<>
			<div className={ styles[ 'firewall-subheading' ] }>
				<Text>{ content }</Text>
				{ ! hasPlan && ( automaticRules || manualRules || allRules ) && (
					<IconTooltip icon={ help } text={ tooltipText } />
				) }
			</div>
			{ ! hasPlan && wafSupported && <FirewallUpgradePrompt /> }
		</>
	);
};

export default FirewallSubheading;
