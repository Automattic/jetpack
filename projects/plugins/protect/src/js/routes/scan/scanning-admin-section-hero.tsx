import { Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import AdminSectionHero from '../../components/admin-section-hero';
import InProgressAnimation from '../../components/in-progress-animation';
import ProgressBar from '../../components/progress-bar';
import ScanNavigation from '../../components/scan-navigation';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const ScanningAdminSectionHero: React.FC = () => {
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities || '0' );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<AdminSectionHero
			main={
				<>
					<AdminSectionHero.Heading>
						{ __( 'Your results will be ready soon', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<>
							{ hasPlan && (
								<ProgressBar
									className={ styles.progress }
									value={ status?.currentProgress }
									total={ 100 }
								/>
							) }
							<Text>
								{ sprintf(
									// translators: placeholder is the number of total vulnerabilities i.e. "22,000".
									__(
										'We are scanning for security threats from our more than %s listed vulnerabilities, powered by WPScan. This could take a minute or two.',
										'jetpack-protect'
									),
									totalVulnerabilitiesFormatted
								) }
							</Text>
						</>
					</AdminSectionHero.Subheading>
					<div className={ styles[ 'scan-navigation' ] }>
						<ScanNavigation />
					</div>
				</>
			}
			secondary={ <InProgressAnimation /> }
			preserveSecondaryOnMobile={ false }
			spacing={ 4 }
		/>
	);
};

export default ScanningAdminSectionHero;
