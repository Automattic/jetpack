import { AdminSectionHero, Container, Col, Status, H3, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import inProgressImage from '../../../../assets/images/in-progress.png';
import ErrorScreen from '../../components/error-section';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ProgressBar from '../progress-bar';
import ScanStatCards from './scan-statcards';
import styles from './styles.module.scss';

const ConnectionErrorCol = () => {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</>
	);
};

const HeaderContainer = () => {
	return (
		<Container horizontalSpacing={ 0 }>
			<ConnectionErrorCol />
		</Container>
	);
};

const ErrorSection = ( { baseErrorMessage, errorMessage, errorCode } ) => {
	return (
		<Col className={ styles[ 'scan-error-screen' ] }>
			<ErrorScreen
				baseErrorMessage={ baseErrorMessage }
				errorMessage={ errorMessage }
				errorCode={ errorCode }
			/>
		</Col>
	);
};

const ScanningSection = ( { currentProgress } ) => {
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<Col>
			<SeventyFiveLayout
				main={
					<div>
						<Container horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ true }>
							<Col>
								<H3 className={ styles[ 'scan-heading' ] } mb={ 2 } mt={ 2 }>
									{ __( 'Your results will be ready soon', 'jetpack-protect' ) }
								</H3>
								{ hasPlan && <ProgressBar value={ currentProgress || 0 } /> }
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
							</Col>
						</Container>
					</div>
				}
				secondary={
					<div className={ styles.illustration }>
						<img src={ inProgressImage } alt="" />
					</div>
				}
				preserveSecondaryOnMobile={ false }
				fluid={ true }
			/>
		</Col>
	);
};

const DefaultSection = ( { summary } ) => {
	return (
		<>
			<Col>
				<Status status="active" label={ __( 'Active', 'jetpack-protect' ) } /> { summary }
			</Col>
			<Col>
				<ScanStatCards />
			</Col>
		</>
	);
};

const ScanHeader = ( {
	isScanning,
	currentProgress = 0,
	baseErrorMessage,
	error,
	errorMessage,
	errorCode,
	summary,
} ) => {
	const renderSection = useMemo( () => {
		if ( error ) {
			return (
				<ErrorSection
					baseErrorMessage={ baseErrorMessage }
					errorMessage={ errorMessage }
					errorCode={ errorCode }
				/>
			);
		}

		if ( isScanning ) {
			return <ScanningSection currentProgress={ currentProgress } />;
		}

		return <DefaultSection summary={ summary } />;
	}, [ isScanning, currentProgress, error, baseErrorMessage, errorMessage, errorCode, summary ] );

	return (
		<AdminSectionHero>
			<HeaderContainer />
			<Container className={ styles[ 'scan-header' ] } horizontalSpacing={ 7 } horizontalGap={ 0 }>
				{ renderSection }
			</Container>
		</AdminSectionHero>
	);
};

export default ScanHeader;
