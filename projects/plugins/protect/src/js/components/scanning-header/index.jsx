import { Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import inProgressImage from '../../../../assets/images/in-progress.png';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import AdminSectionHero from '../admin-section-hero';
import ProgressBar from '../progress-bar';
import styles from './styles.module.scss';

const ScanningHeader = ( { currentProgress } ) => {
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<AdminSectionHero
			heading={ __( 'Your results will be ready soon', 'jetpack-protect' ) }
			subheading={
				<>
					{ hasPlan && <ProgressBar value={ currentProgress } /> }
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
			}
			showNavigation={ true }
			secondary={
				<div className={ styles.illustration }>
					<img src={ inProgressImage } alt="" />
				</div>
			}
			preserveSecondaryOnMobile={ false }
		/>
	);
};

export default ScanningHeader;
