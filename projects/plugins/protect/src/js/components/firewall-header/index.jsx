import { AdminSectionHero, Container, Col, Text, H3, Status } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import FirewallStatCards from './firewall-statcards';
import FirewallSubheading from './firewall-subheading';
import styles from './styles.module.scss';

const FirewallHeader = ( {
	status,
	hasPlan,
	automaticRulesAvailable,
	jetpackWafIpBlockListEnabled,
	jetpackWafIpAllowListEnabled,
	jetpackWafAutomaticRules,
	bruteForceProtectionIsEnabled,
	wafSupported,
	oneDayStats,
	thirtyDayStats,
	standaloneMode,
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
									( jetpackWafAutomaticRules
										? __( 'Automatic firewall is on', 'jetpack-protect' )
										: __(
												'Firewall is on',
												'jetpack-protect',
												/* dummy arg to avoid bad minification */ 0
										  ) ) }
							</H3>
							<FirewallSubheading
								jetpackWafIpBlockListEnabled={ jetpackWafIpBlockListEnabled }
								jetpackWafIpAllowListEnabled={ jetpackWafIpAllowListEnabled }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasPlan={ hasPlan }
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
								jetpackWafIpBlockListEnabled={ jetpackWafIpBlockListEnabled }
								jetpackWafIpAllowListEnabled={ jetpackWafIpAllowListEnabled }
								jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
								bruteForceProtectionIsEnabled={ bruteForceProtectionIsEnabled }
								hasPlan={ hasPlan }
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
						<FirewallStatCards
							status={ status }
							hasPlan={ hasPlan }
							oneDayStats={ oneDayStats }
							thirtyDayStats={ thirtyDayStats }
						/>
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
			jetpackWafIpBlockListEnabled,
			jetpackWafIpAllowListEnabled,
			standaloneMode,
			automaticRulesAvailable,
			bruteForceProtection,
		},
		isToggling,
		wafSupported,
		stats,
		isEnabled,
	} = useWafData();
	const { hasPlan } = usePlan();
	const isSupportedWafFeatureEnabled = wafSupported ? isEnabled : bruteForceProtection;
	const currentStatus = isSupportedWafFeatureEnabled ? 'on' : 'off';
	const { currentDay: currentDayBlockCount, thirtyDays: thirtyDayBlockCounts } = stats
		? stats.blockedRequests
		: { oneDayStats: 0, thirtyDayStats: 0 };

	return (
		<FirewallHeader
			status={ isToggling ? 'loading' : currentStatus }
			hasPlan={ hasPlan }
			automaticRulesAvailable={ automaticRulesAvailable }
			jetpackWafIpBlockListEnabled={ jetpackWafIpBlockListEnabled }
			jetpackWafIpAllowListEnabled={ jetpackWafIpAllowListEnabled }
			jetpackWafAutomaticRules={ jetpackWafAutomaticRules }
			bruteForceProtectionIsEnabled={ bruteForceProtection }
			wafSupported={ wafSupported }
			oneDayStats={ currentDayBlockCount }
			thirtyDayStats={ thirtyDayBlockCounts }
			standaloneMode={ standaloneMode }
		/>
	);
};

export { FirewallHeader };

export default ConnectedFirewallHeader;
