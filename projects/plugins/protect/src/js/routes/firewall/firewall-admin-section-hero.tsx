import { Text } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { useMemo } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import useWafData from '../../hooks/use-waf-data';
import FirewallStatCards from './firewall-statcards';
import FirewallSubheading from './firewall-subheading';

const FirewallAdminSectionHero = () => {
	const {
		config: {
			jetpackWafAutomaticRules,
			automaticRulesAvailable,
			standaloneMode,
			bruteForceProtection: isBruteForceModuleEnabled,
		},
		isEnabled: isWafModuleEnabled,
		wafSupported,
		isToggling,
	} = useWafData();

	const isSupportedWafFeatureEnabled = wafSupported
		? isWafModuleEnabled
		: isBruteForceModuleEnabled;
	const currentStatus = isSupportedWafFeatureEnabled ? 'on' : 'off';
	const status = isToggling ? 'loading' : currentStatus;

	const statusLabel = useMemo( () => {
		if ( status === 'on' ) {
			return standaloneMode
				? __( 'Standalone mode', 'jetpack-protect' )
				: _x( 'Active', 'The module status', 'jetpack-protect' );
		}

		return __( 'Inactive', 'jetpack-protect' );
	}, [ status, standaloneMode ] );

	const heading = useMemo( () => {
		if ( status === 'on' ) {
			return (
				<>
					{ ! wafSupported && __( 'Brute force protection is active', 'jetpack-protect' ) }
					{ wafSupported &&
						( jetpackWafAutomaticRules
							? __( 'Automatic firewall is on', 'jetpack-protect' )
							: _x(
									'Firewall is on',
									'Explanatory text for firewall on status',
									'jetpack-protect'
							  ) ) }
				</>
			);
		}

		if ( status === 'off' ) {
			return (
				<>
					{ ! wafSupported && __( 'Brute force protection is disabled', 'jetpack-protect' ) }
					{ wafSupported &&
						( automaticRulesAvailable
							? __( 'Automatic firewall is off', 'jetpack-protect' )
							: _x(
									'Firewall is off',
									'Explanatory text for firewall off status',
									'jetpack-protect'
							  ) ) }
				</>
			);
		}

		if ( status === 'loading' ) {
			return __( 'Automatic firewall is being set up', 'jetpack-protect' );
		}

		return null;
	}, [ status, wafSupported, jetpackWafAutomaticRules, automaticRulesAvailable ] );

	const subheading = useMemo( () => {
		if ( status === 'loading' ) {
			return <Text>{ __( 'Please wait…', 'jetpack-protect' ) }</Text>;
		}

		return <FirewallSubheading />;
	}, [ status ] );

	const indicatorStatus = 'on' === status ? 'active' : 'inactive';

	return (
		<AdminSectionHero
			main={
				<>
					<AdminSectionHero.StatusIndicator status={ indicatorStatus } label={ statusLabel } />
					<AdminSectionHero.Heading>{ heading }</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>{ subheading }</AdminSectionHero.Subheading>
				</>
			}
			secondary={ wafSupported && <FirewallStatCards /> }
		/>
	);
};

export default FirewallAdminSectionHero;
