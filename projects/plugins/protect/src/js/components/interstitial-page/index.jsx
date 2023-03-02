import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
	Text,
	Button,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useState, useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Logo from '../logo';
import ConnectedPricingTable from '../pricing-table';
import styles from './styles.module.scss';

/**
 * Interstitial Page
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @returns {React.Component}              Interstitial react component.
 */
const InterstitialPage = ( { onScanAdd } ) => {
	const [ getStartedButtonIsLoading, setGetStartedButtonIsLoading ] = useState( false );

	const getStarted = useCallback( () => {
		setGetStartedButtonIsLoading( true );
		onScanAdd();
	}, [ onScanAdd ] );

	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_interstitial',
	} );

	return (
		<JetpackAdminPage
			moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
			header={
				<div className={ styles[ 'protect-header' ] }>
					<Logo />
					<Text>
						{ __( 'Already have an existing plan or license key? ', 'jetpack-protect' ) }
						<Button
							className={ styles[ 'get-started-button' ] }
							variant={ 'link' }
							weight={ 'regular' }
							onClick={ getStarted }
							isLoading={ getStartedButtonIsLoading }
						>
							{ __( 'Click here to get started', 'jetpack-protect' ) }
						</Button>
					</Text>
				</div>
			}
		>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<ConnectedPricingTable onScanAdd={ onScanAdd } />
					</Col>
				</Container>
			</AdminSectionHero>
		</JetpackAdminPage>
	);
};

export default InterstitialPage;
