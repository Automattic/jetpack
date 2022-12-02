import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
	Text,
	Button,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { STORE_ID } from '../../state/store';
import Logo from '../logo';
import ConnectedPricingTable from '../pricing-table';
import styles from './styles.module.scss';

/**
 * Intersitial Page
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @param {Function} props.scanJustAdded - Callback when adding paid protect product was recently added
 * @returns {React.Component}              Interstitial react component.
 */
const InterstitialPage = ( { onScanAdd, scanJustAdded } ) => {
	const { siteIsRegistering, handleRegisterSite, registrationError } = useConnection( {
		skipUserConnection: true,
	} );

	const { refreshPlan, refreshStatus } = useDispatch( STORE_ID );

	const onClickHandler = useCallback( () => {
		return handleRegisterSite().then( () => {
			refreshPlan();
			refreshStatus( true );
		} );
	}, [ handleRegisterSite, refreshPlan, refreshStatus ] );

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
							onClick={ onClickHandler }
							isLoading={ siteIsRegistering }
							error={
								registrationError
									? __( 'An error occurred. Please try again.', 'jetpack-protect' )
									: null
							}
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
						<ConnectedPricingTable onScanAdd={ onScanAdd } scanJustAdded={ scanJustAdded } />
					</Col>
				</Container>
			</AdminSectionHero>
		</JetpackAdminPage>
	);
};

export default InterstitialPage;
