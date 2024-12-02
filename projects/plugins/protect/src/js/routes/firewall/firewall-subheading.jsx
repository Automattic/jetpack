import { Text, IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import FirewallUpgradePrompt from './firewall-upgrade-prompt';
import styles from './styles.module.scss';

const FirewallSubheading = () => {
	const { hasPlan } = usePlan();
	const {
		config: {
			jetpackWafAutomaticRules,
			jetpackWafIpBlockListEnabled,
			jetpackWafIpAllowListEnabled,
			automaticRulesAvailable,
			bruteForceProtection: isBruteForceModuleEnabled,
		},
		wafSupported,
	} = useWafData();

	const allowOrBlockListEnabled = jetpackWafIpBlockListEnabled || jetpackWafIpAllowListEnabled;

	const wafRules = useMemo(
		() => ( {
			allRules: wafSupported && jetpackWafAutomaticRules && allowOrBlockListEnabled,
			automaticRules: wafSupported && jetpackWafAutomaticRules && ! allowOrBlockListEnabled,
			manualRules: wafSupported && ! jetpackWafAutomaticRules && allowOrBlockListEnabled,
			noRules: wafSupported && ! jetpackWafAutomaticRules && ! allowOrBlockListEnabled,
		} ),
		[ wafSupported, jetpackWafAutomaticRules, allowOrBlockListEnabled ]
	);

	const content = useMemo( () => {
		const textSegments = [];

		if ( wafSupported && isBruteForceModuleEnabled ) {
			textSegments.push( __( 'Brute force protection is active.', 'jetpack-protect' ) );
		}

		if ( wafRules.noRules ) {
			textSegments.push( __( 'There are no firewall rules applied.', 'jetpack-protect' ) );
		}

		if ( wafRules.automaticRules ) {
			textSegments.push( __( 'Automatic firewall rules apply.', 'jetpack-protect' ) );
		}

		if ( wafRules.manualRules ) {
			textSegments.push( __( 'Only manual IP list rules apply.', 'jetpack-protect' ) );
		}

		if ( wafRules.allRules ) {
			textSegments.push( __( 'All firewall rules apply.', 'jetpack-protect' ) );
		}

		return textSegments.join( ' ' );
	}, [ wafSupported, isBruteForceModuleEnabled, wafRules ] );

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

	const renderTooltip = () => {
		if ( ! hasPlan && ( wafRules.automaticRules || wafRules.manualRules || wafRules.allRules ) ) {
			return (
				<IconTooltip
					className={ styles[ 'icon-tooltip' ] }
					iconCode={ 'help-outline' }
					iconSize={ 20 }
					iconClassName={ styles[ 'icon-tooltip__icon' ] }
					placement={ 'top' }
					hoverShow={ true }
				>
					<Text>{ tooltipText }</Text>
				</IconTooltip>
			);
		}
		return null;
	};

	return (
		<>
			<div className={ styles[ 'firewall-subheading' ] }>
				<Text>{ content }</Text>
				{ renderTooltip() }
			</div>
			{ ! hasPlan && wafSupported && <FirewallUpgradePrompt /> }
		</>
	);
};

export default FirewallSubheading;
