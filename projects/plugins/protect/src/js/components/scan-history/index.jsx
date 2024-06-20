import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useScanHistory from '../../hooks/use-protect-data';
import AdminPage from '../admin-page';
import AlertSVGIcon from '../alert-icon';
import ScanFooter from '../scan-footer';
import ScanHistorySummary from '../scan-history-summary';
import ScanHistoryThreatsList from '../scan-history-threats-list';
import SeventyFiveLayout from '../seventy-five-layout';
import inProgressImage from './in-progress.png';
import styles from './styles.module.scss';

const ScanHistory = () => {
	const { error, errorCode, errorMessage } = useScanHistory();
	const { hasConnectionError } = useConnectionErrorNotice();

	// Error
	if ( error ) {
		let displayErrorMessage = errorMessage
			? `${ errorMessage } (${ errorCode }).`
			: __( 'We are having problems retrieving your scan history.', 'jetpack-protect' );
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
								<H3>
									{ __( 'We’re having problems retrieving your scan history', 'jetpack-protect' ) }
								</H3>
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
						<ScanHistorySummary />
					</Col>
					<Col>
						<ScanHistoryThreatsList />
					</Col>
				</Container>
			</AdminSectionHero>
			<ScanFooter />
		</AdminPage>
	);
};

export default ScanHistory;
