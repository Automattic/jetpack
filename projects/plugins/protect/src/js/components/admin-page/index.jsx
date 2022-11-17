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
import camelize from 'camelize';
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
	const { refreshStatus } = useDispatch( STORE_ID );
	const { statusIsFetching, scanIsUnavailable, status } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		scanIsUnavailable: select( STORE_ID ).getScanIsUnavailable(),
		status: select( STORE_ID ).getStatus(),
	} ) );
	useCredentials();

	// retry fetching status if it is not available
	useEffect( () => {
		if ( ! statusIsFetching && 'unavailable' === status.status ) {
			refreshStatus( true );
		}
	}, [ statusIsFetching, status.status, refreshStatus ] );

	let currentScanStatus;
	if ( 'error' === currentStatus || scanIsUnavailable ) {
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
	if ( 'error' === currentStatus || scanIsUnavailable ) {
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

	// When there's no information yet. Usually when the plugin was just activated
	if (
		[ 'scheduled', 'scanning', 'optimistically_scanning' ].indexOf( status.status ) >= 0 ||
		! lastChecked
	) {
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
										<span>{ __( 'Scanning your site…', 'jetpack-protect' ) }</span>
									</Col>
									<Col>
										<H3>{ __( 'Your results will be ready soon', 'jetpack-protect' ) }</H3>
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
 * When the status is 'scheduled' or 'scanning', re-checks the status periodically until it isn't.
 */
const useStatusPolling = () => {
	const status = useSelect( select => select( STORE_ID ).getStatus() );
	const { setStatus, setStatusIsFetching, setScanIsUnavailable } = useDispatch( STORE_ID );

	useEffect( () => {
		let pollTimeout;
		const pollDuration = 10000;

		const statusIsInProgress = currentStatus =>
			[ 'scheduled', 'scanning' ].indexOf( currentStatus ) >= 0;

		const pollStatus = () => {
			return new Promise( ( resolve, reject ) => {
				apiFetch( {
					path: 'jetpack-protect/v1/status?hard_refresh=true',
					method: 'GET',
				} )
					.then( newStatus => {
						if ( newStatus?.error ) {
							throw newStatus?.errorMessage;
						}

						if ( statusIsInProgress( newStatus?.status ) ) {
							pollTimeout = setTimeout( () => {
								pollStatus()
									.then( result => resolve( result ) )
									.catch( error => reject( error ) );
							}, pollDuration );
							return;
						}

						resolve( newStatus );
					} )
					.catch( () => {
						// Keep trying when unable to fetch the status.
						setTimeout( pollStatus, 5000 );
					} );
			} );
		};

		if ( ! statusIsInProgress( status?.status ) ) {
			return;
		}

		pollTimeout = setTimeout( () => {
			setStatusIsFetching( true );
			pollStatus()
				.then( newStatus => {
					setScanIsUnavailable( 'unavailable' === newStatus.status );
					setStatus( camelize( newStatus ) );
				} )
				.finally( () => {
					setStatusIsFetching( false );
				} );
		}, pollDuration );

		return () => clearTimeout( pollTimeout );
	}, [ status.status, setScanIsUnavailable, setStatus, setStatusIsFetching ] );
};

const Admin = () => {
	useRegistrationWatcher();
	useStatusPolling();

	const { refreshPlan, startScanOptimistically, refreshStatus } = useDispatch( STORE_ID );
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run, isRegistered, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: addQueryArgs( adminUrl, { checkPlan: true } ),
		siteProductAvailabilityHandler: async () =>
			apiFetch( {
				path: 'jetpack-protect/v1/check-plan',
				method: 'GET',
			} ).then( hasRequiredPlan => hasRequiredPlan ),
	} );

	useEffect( () => {
		if ( getQueryArg( window.location.search, 'checkPlan' ) ) {
			startScanOptimistically();
			setTimeout( () => {
				refreshPlan();
				refreshStatus( true );
			}, 5000 );
		}
	}, [ refreshPlan, refreshStatus, startScanOptimistically ] );

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
