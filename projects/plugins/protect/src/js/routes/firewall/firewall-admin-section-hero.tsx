import { Status, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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

	let statusLabel, heading, subheading;
	switch ( status ) {
		case 'on':
			statusLabel = standaloneMode
				? __( 'Standalone mode', 'jetpack-protect' )
				: __( 'Active', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 );
			heading = (
				<>
					{ ! wafSupported && __( 'Brute force protection is active', 'jetpack-protect' ) }
					{ wafSupported &&
						( jetpackWafAutomaticRules
							? __( 'Automatic firewall is on', 'jetpack-protect' )
							: __(
									'Firewall is on',
									'jetpack-protect',
									/* dummy arg to avoid bad minification */ 0
							  ) ) }
				</>
			);
			subheading = <FirewallSubheading />;
			break;

		case 'off':
			statusLabel = __( 'Inactive', 'jetpack-protect' );
			heading = (
				<>
					{ ! wafSupported && __( 'Brute force protection is disabled', 'jetpack-protect' ) }
					{ wafSupported &&
						( automaticRulesAvailable
							? __( 'Automatic firewall is off', 'jetpack-protect' )
							: __(
									'Firewall is off',
									'jetpack-protect',
									/* dummy arg to avoid bad minification */ 0
							  ) ) }
				</>
			);
			subheading = <FirewallSubheading />;
			break;

		case 'loading':
			statusLabel = __( 'Inactive', 'jetpack-protect' );
			heading = __( 'Automatic firewall is being set up', 'jetpack-protect' );
			subheading = <Text>{ __( 'Please wait…', 'jetpack-protect' ) }</Text>;
			break;

		default:
			return null; // Fallback case for unexpected status
	}

	return (
		<AdminSectionHero
			main={
				<>
					<Status status={ 'on' === status ? 'active' : 'inactive' } label={ statusLabel } />
					<AdminSectionHero.Heading>{ heading }</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>{ subheading }</AdminSectionHero.Subheading>
				</>
			}
			secondary={ wafSupported && <FirewallStatCards /> }
		/>
	);
};

export default FirewallAdminSectionHero;
