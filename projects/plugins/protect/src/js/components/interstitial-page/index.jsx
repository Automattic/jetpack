import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
	Text,
	Button,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Logo from '../logo';
import ConnectedPricingTable from '../pricing-table';
import styles from './styles.module.scss';

/**
 * Interstitial Page
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @param {Function} props.scanJustAdded - Callback when adding paid protect product was recently added
 * @returns {React.Component}              Interstitial react component.
 */
const InterstitialPage = ( { onScanAdd, scanJustAdded } ) => {
	const { siteIsRegistering } = useConnection();
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
		siteProductAvailabilityHandler: async () => {
			apiFetch( {
				path: 'jetpack-protect/v1/check-plan',
				method: 'GET',
			} ).then( hasRequiredPlan => hasRequiredPlan );
		},
	} );

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
							onClick={ run }
							isLoading={ siteIsRegistering }
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
