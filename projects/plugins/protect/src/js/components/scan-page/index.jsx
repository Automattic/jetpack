import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import AlertSVGIcon from '../alert-icon';
import ScanFooter from '../scan-footer';
import SeventyFiveLayout from '../seventy-five-layout';
import Summary from '../summary';
import ThreatsList from '../threats-list';
import inProgressImage from './in-progress.png';
import styles from './styles.module.scss';
import useCredentials from './use-credentials';
import useStatusPolling from './use-status-polling';

export const JETPACK_SCAN = 'jetpack_scan';

const ScanPage = () => {
	const { lastChecked, currentStatus, errorCode, errorMessage } = useProtectData();
	const { hasConnectionError } = useConnectionErrorNotice();
	const { refreshStatus } = useDispatch( STORE_ID );
	const { statusIsFetching, scanIsUnavailable, status } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		scanIsUnavailable: select( STORE_ID ).getScanIsUnavailable(),
		status: select( STORE_ID ).getStatus(),
	} ) );
	let currentScanStatus;
	if ( 'error' === currentStatus || scanIsUnavailable ) {
		currentScanStatus = 'error';
	} else if ( ! lastChecked ) {
		currentScanStatus = 'in_progress';
	} else {
		currentScanStatus = 'active';
	}

	useStatusPolling();
	useCredentials();

	// retry fetching status if it is not available
	useEffect( () => {
		if ( ! statusIsFetching && 'unavailable' === status.status && ! scanIsUnavailable ) {
			refreshStatus( true );
		}
	}, [ statusIsFetching, status.status, refreshStatus, scanIsUnavailable ] );

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
				<ScanFooter />
			</AdminPage>
		);
	}

	// When there's no information yet. Usually when the plugin was just activated
	if (
		[ 'scheduled', 'scanning', 'optimistically_scanning' ].indexOf( status.status ) >= 0 ||
		! lastChecked
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
				<ScanFooter />
			</AdminPage>
		);
	}

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
	);
};

export default ScanPage;
