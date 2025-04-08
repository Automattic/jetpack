import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const FirewallUpgradePrompt = () => {
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
		<Button className={ styles[ 'upgrade-prompt-button' ] } onClick={ getScan }>
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

export default FirewallUpgradePrompt;
