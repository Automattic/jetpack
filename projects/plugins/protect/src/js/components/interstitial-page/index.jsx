import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
	Text,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Logo from '../logo';
import ConnectedPricingTable from '../pricing-table';
import styles from './styles.module.scss';

const ACTIVATE_LICENSE_URL = 'admin.php?page=my-jetpack#/add-license';

/**
 * Interstitial Page
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @returns {React.Component}              Interstitial react component.
 */
const InterstitialPage = ( { onScanAdd } ) => {
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
					<Text variant="body-small">
						{ createInterpolateElement(
							__(
								'Already have an existing plan or license key? <a>Click here to get started</a>',
								'jetpack-protect'
							),
							{
								a: <a href={ ACTIVATE_LICENSE_URL } />,
							}
						) }
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
