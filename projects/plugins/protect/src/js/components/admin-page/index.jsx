import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	H3,
	Text,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import {
	useProductCheckoutWorkflow,
	useConnection,
	useConnectionErrorNotice,
	ConnectionError,
} from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import classnames from 'classnames';
import React, { useEffect } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import AlertSVGIcon from '../alert-icon';
import Footer from '../footer';
import Interstitial from '../interstitial';
import Logo from '../logo';
import Summary from '../summary';
import ThreatsList from '../threats-list';
import inProgressImage from './in-progress.png';
import styles from './styles.module.scss';

export const JETPACK_SCAN = 'jetpack_scan';

/**
 * SeventyFive layout meta component
 * The component name references to
 * the sections disposition of the layout.
 * FiftyFifty, 75, thus 7|5 means the cols numbers
 * for main and secondary sections respectively,
 * in large lg viewport size.
 *
 * @param {object} props                            - Component props
 * @param {React.ReactNode} props.main              - Main section component
 * @param {React.ReactNode} props.secondary         - Secondary section component
 * @param {boolean} props.preserveSecondaryOnMobile - Whether to show secondary section on mobile
 * @returns {React.ReactNode} 					    - React meta-component
 */
export const SeventyFiveLayout = ( { main, secondary, preserveSecondaryOnMobile = false } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const classNames = classnames( {
		[ styles[ 'is-viewport-small' ] ]: isSmall,
	} );

	/*
	 * By convention, secondary section is not shown when:
	 * - preserveSecondaryOnMobile is false
	 * - on mobile breakpoint (sm)
	 */
	const hideSecondarySection = ! preserveSecondaryOnMobile && isSmall;

	return (
		<Container className={ classNames } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ false }>
			{ ! hideSecondarySection && (
				<>
					<Col sm={ 4 } md={ 4 } className={ styles.main }>
						{ main }
					</Col>
					<Col sm={ 4 } md={ 4 } className={ styles.secondary }>
						{ secondary }
					</Col>
				</>
			) }
			{ hideSecondarySection && <Col>{ main }</Col> }
		</Container>
	);
};

const InterstitialPage = ( { run, hasCheckoutStarted } ) => {
	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<Interstitial onScanAdd={ run } scanJustAdded={ hasCheckoutStarted } />
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

const useCredentials = () => {
	const { checkCredentials } = useDispatch( STORE_ID );
	const credentials = useSelect( select => select( STORE_ID ).getCredentials() );

	useEffect( () => {
		if ( ! credentials ) {
			checkCredentials();
		}
	}, [ checkCredentials, credentials ] );
};

const ProtectAdminPage = () => {
	const { lastChecked, currentStatus, errorCode, errorMessage } = useProtectData();
	const { hasConnectionError } = useConnectionErrorNotice();
	const status = useSelect( select => select( STORE_ID ).getStatus() );
	useCredentials();

	let currentScanStatus;
	if ( 'error' === currentStatus ) {
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
		},
	} );

	// Error
	if ( 'error' === currentStatus ) {
		let displayErrorMessage = errorMessage
			? `${ errorMessage } (${ errorCode }).`
			: __( 'We are having problems scanning your site.', 'jetpack-protect' );
		displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

		return (
			<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
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
					<SeventyFiveLayout
						main={
							<div className={ styles[ 'main-content' ] }>
								<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } />
								<H3>{ __( 'We’re having problems scanning your site', 'jetpack-protect' ) }</H3>
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
				<Footer />
			</AdminPage>
		);
	}

	// When there's a scan in progress or no information yet.
	if ( [ 'scheduled', 'scanning' ].indexOf( status.status ) >= 0 || ! lastChecked ) {
		const { currentProgress } = status;
		const preparing = __( 'Preparing to scan…', 'jetpack-protect' );
		const scanning = __( 'Scannning your site…', 'jetpack-protect' );
		const heading = currentProgress === 0 ? preparing : scanning;

		return (
			<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
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
										<span>{ heading }</span>
									</Col>
									<Col>
										<H3>{ __( 'Your results will be ready soon', 'jetpack-protect' ) }</H3>
										{ currentProgress >= 0 && (
											<div className={ styles[ 'progress-bar' ] }>
												<ProgressBar
													className={ styles[ 'progress-bar' ] }
													value={ currentProgress }
													total={ 100 }
													color="#069E08"
												/>
												<p className={ styles[ 'progress-bar-percent' ] }>{ currentProgress }%</p>
											</div>
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
				<Footer />
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
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
			<Footer />
		</AdminPage>
	);
};

const useRegistrationWatcher = () => {
	const { isRegistered } = useConnection();
	const { refreshStatus } = useDispatch( STORE_ID );
	const status = useSelect( select => select( STORE_ID ).getStatus() );

	useEffect( () => {
		if ( isRegistered && ! status.status ) {
			refreshStatus();
		}
		// We don't want to run the effect if status changes. Only on changes on isRegistered.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isRegistered ] );
};

/**
 * Use Status Polling
 *
 * When the status is 'scheduled', re-checks the status periodically until it isn't.
 */
const useStatusPolling = () => {
	const pollingDuration = 10000;
	const { refreshStatus } = useDispatch( STORE_ID );
	const status = useSelect( select => select( STORE_ID ).getStatus() );

	useEffect( () => {
		let pollTimeout;

		const pollStatus = () => {
			refreshStatus( true )
				.then( latestStatus => {
					if (
						[ 'scheduled', 'scanning' ].indexOf( latestStatus.status ) >= 0 ||
						! latestStatus.status.lastChecked
					) {
						clearTimeout( pollTimeout );
						pollTimeout = setTimeout( pollStatus, pollingDuration );
					}
				} )
				.catch( () => {
					// Keep trying when unable to fetch the status.
					clearTimeout( pollTimeout );
					pollTimeout = setTimeout( pollStatus, pollingDuration );
				} );
		};

		if ( [ 'scheduled', 'scanning' ].indexOf( status.status ) >= 0 ) {
			pollTimeout = setTimeout( pollStatus, pollingDuration );
		}

		return () => clearTimeout( pollTimeout );
	}, [ status.status, refreshStatus ] );
};

const Admin = () => {
	useRegistrationWatcher();
	useStatusPolling();

	const { refreshPlan } = useDispatch( STORE_ID );
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run, isRegistered, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: addQueryArgs( adminUrl, { checkPlan: true } ),
		siteProductAvailabilityHandler: async () =>
			apiFetch( {
				path: 'jetpack-protect/v1/plan',
				method: 'GET',
			} ).then( jetpackScan => jetpackScan?.has_required_plan ),
	} );

	useEffect( () => {
		if ( getQueryArg( window.location.search, 'checkPlan' ) ) {
			refreshPlan();
		}
	}, [ refreshPlan ] );

	/*
	 * Show interstital page when
	 * - Site is not registered
	 * - Checkout workflow has started
	 */
	if ( ! isRegistered || hasCheckoutStarted ) {
		return <InterstitialPage run={ run } hasCheckoutStarted={ hasCheckoutStarted } />;
	}

	return <ProtectAdminPage />;
};

export default Admin;
