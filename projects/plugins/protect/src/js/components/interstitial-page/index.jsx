import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import Logo from '../logo';
import ConnectedPricingTable from '../pricing-table';

/**
 * Intersitial Page
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @param {Function} props.scanJustAdded - Callback when adding paid protect product was recently added
 * @returns {React.Component}              Interstitial react component.
 */
const InterstitialPage = ( { onScanAdd, scanJustAdded } ) => {
	return (
		<JetpackAdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<ConnectedPricingTable onScanAdd={ onScanAdd } scanJustAdded={ scanJustAdded } />;
					</Col>
				</Container>
			</AdminSectionHero>
		</JetpackAdminPage>
	);
};

export default InterstitialPage;
