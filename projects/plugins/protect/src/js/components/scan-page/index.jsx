import { AdminSectionHero, Container, Col, H3, Text, Button } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import useProtectData from '../../hooks/use-protect-data';
import useScanHistory from '../../hooks/use-scan-history';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import AlertSVGIcon from '../alert-icon';
import ProgressBar from '../progress-bar';
import ScanFooter from '../scan-footer';
import SeventyFiveLayout from '../seventy-five-layout';
import Summary from '../summary';
import ThreatsList from '../threats-list';
import inProgressImage from './in-progress.png';
import onboardingSteps from './onboarding-steps';
import styles from './styles.module.scss';
import useCredentials from './use-credentials';
import useStatusPolling from './use-status-polling';

const ScanPage = () => {
	const protectData = useProtectData();
	const scanHistory = useScanHistory();
	const { viewingScanHistory, handleCurrentClick, handleHistoryClick, allScanHistoryIsLoading } =
		scanHistory;

	const source = viewingScanHistory ? scanHistory : protectData;
	const { lastChecked, error, errorCode, errorMessage, hasRequiredPlan } = source;
	// todo: need to better handle various states when were viewing history or status

	const activityContext = viewingScanHistory
		? 'retrieving your scan history'
		: 'scanning your site';
	const baseErrorMessage = sprintf(
		/* translators: %s is the activity context, like "scanning your site" or "retrieving your scan history" */
		__( 'We are having problems %s.', 'jetpack-protect' ),
		activityContext
	);

	const { hasConnectionError } = useConnectionErrorNotice();
	const { refreshStatus } = useDispatch( STORE_ID );
	const { statusIsFetching, scanIsUnavailable, status } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		scanIsUnavailable: select( STORE_ID ).getScanIsUnavailable(),
		status: select( STORE_ID ).getStatus(),
	} ) );

	// todo: this is only for scan, dont need this for the history
	let currentScanStatus;
	if ( status.error || scanIsUnavailable ) {
		currentScanStatus = 'error';
	} else if ( ! lastChecked ) {
		currentScanStatus = 'in_progress';
	} else {
		currentScanStatus = 'active';
	}

	// Track view for Protect admin page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_admin',
		pageViewEventProperties: {
			check_status: currentScanStatus,
			has_plan: hasRequiredPlan,
		},
	} );

	useStatusPolling();
	useCredentials();

	// retry fetching status if it is not available
	useEffect( () => {
		if ( ! statusIsFetching && 'unavailable' === status.status && ! scanIsUnavailable ) {
			refreshStatus( true );
		}
	}, [ statusIsFetching, status.status, refreshStatus, scanIsUnavailable ] );

	// Error
	if ( error ) {
		let displayErrorMessage = errorMessage
			? `${ errorMessage } (${ errorCode }).`
			: baseErrorMessage;
		displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

		return (
			<AdminPage>
				<AdminSectionHero>
					<Container horizontalSpacing={ 0 }>
						{ hasConnectionError && (
							<Col className={ styles[ 'connection-error-col' ] }>
								<ConnectionError />
							</Col>
						) }
						<Col>
							<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
						</Col>
						<Col className={ styles[ 'history-button-col' ] }>
							{ ! viewingScanHistory ? (
								<Button
									variant="secondary"
									onClick={ handleHistoryClick }
									isLoading={ allScanHistoryIsLoading }
								>
									{ __( 'History', 'jetpack-protect' ) }
								</Button>
							) : (
								<Button variant="secondary" onClick={ handleCurrentClick }>
									{ __( 'Current', 'jetpack-protect' ) }
								</Button>
							) }
						</Col>
					</Container>
					<SeventyFiveLayout
						main={
							<div className={ styles[ 'main-content' ] }>
								<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } />
								<H3>{ baseErrorMessage }</H3>
								<Text>{ displayErrorMessage }</Text>
							</div>
						}
						secondary={
							<div className={ styles.illustration }>
								<img src={ inProgressImage } alt="" />
							</div>
						}
						preserveSecondaryOnMobile={ false }
					/>
				</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		);
	}

	if ( scanIsUnavailable && ! viewingScanHistory ) {
		let displayErrorMessage = errorMessage
			? `${ errorMessage } (${ errorCode }).`
			: baseErrorMessage;
		displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

		return (
			<AdminPage>
				<AdminSectionHero>
					<Container horizontalSpacing={ 0 }>
						{ hasConnectionError && (
							<Col className={ styles[ 'connection-error-col' ] }>
								<ConnectionError />
							</Col>
						) }
						<Col>
							<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
						</Col>
						<Col className={ styles[ 'history-button-col' ] }>
							{ ! viewingScanHistory ? (
								<Button
									variant="secondary"
									onClick={ handleHistoryClick }
									isLoading={ allScanHistoryIsLoading }
								>
									{ __( 'History', 'jetpack-protect' ) }
								</Button>
							) : (
								<Button variant="secondary" onClick={ handleCurrentClick }>
									{ __( 'Current', 'jetpack-protect' ) }
								</Button>
							) }
						</Col>
					</Container>
					<SeventyFiveLayout
						main={
							<div className={ styles[ 'main-content' ] }>
								<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } />
								<H3>{ baseErrorMessage }</H3>
								<Text>{ displayErrorMessage }</Text>
							</div>
						}
						secondary={
							<div className={ styles.illustration }>
								<img src={ inProgressImage } alt="" />
							</div>
						}
						preserveSecondaryOnMobile={ false }
					/>
				</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		);
	}

	// When there's no information yet. Usually when the plugin was just activated
	if (
		! viewingScanHistory &&
		( [ 'scheduled', 'scanning', 'optimistically_scanning' ].indexOf( status.status ) >= 0 ||
			! lastChecked )
	) {
		return (
			<AdminPage>
				<AdminSectionHero>
					<Container horizontalSpacing={ 0 }>
						{ hasConnectionError && (
							<Col className={ styles[ 'connection-error-col' ] }>
								<ConnectionError />
							</Col>
						) }
						<Col>
							<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
						</Col>
						<Col className={ styles[ 'history-button-col' ] }>
							{ ! viewingScanHistory ? (
								<Button
									variant="secondary"
									onClick={ handleHistoryClick }
									isLoading={ allScanHistoryIsLoading }
								>
									{ __( 'History', 'jetpack-protect' ) }
								</Button>
							) : (
								<Button variant="secondary" onClick={ handleCurrentClick }>
									{ __( 'Current', 'jetpack-protect' ) }
								</Button>
							) }
						</Col>
					</Container>
					<SeventyFiveLayout
						main={
							<div className={ styles[ 'main-content' ] }>
								<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
									<Col className={ styles[ 'loading-content' ] }>
										<Spinner
											style={ {
												color: 'black',
												marginTop: 0,
												marginLeft: 0,
											} }
										/>
										<span>{ __( 'Scanning your site…', 'jetpack-protect' ) }</span>
									</Col>
									<Col>
										<H3 style={ { textWrap: 'balance' } }>
											{ __( 'Your results will be ready soon', 'jetpack-protect' ) }
										</H3>
										{ status.currentProgress !== null && status.currentProgress >= 0 && (
											<ProgressBar value={ status.currentProgress } />
										) }
										<Text>
											{ __(
												'We are scanning for security threats from our more than 22,000 listed vulnerabilities, powered by WPScan. This could take a minute or two.',
												'jetpack-protect'
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
					/>
				</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		);
	}

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<AdminSectionHero>
					<Container horizontalSpacing={ 0 }>
						{ hasConnectionError && (
							<Col className={ styles[ 'connection-error-col' ] }>
								<ConnectionError />
							</Col>
						) }
						<Col>
							<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
						</Col>
					</Container>
					<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
						<Col>
							<Summary />
						</Col>
						<Col>
							<ThreatsList />
						</Col>
					</Container>
				</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
