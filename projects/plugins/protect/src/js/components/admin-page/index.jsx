/* global jetpackProtectInitialState */
/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';

import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	getProductCheckoutUrl,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import Summary from '../summary';
import VulnerabilitiesList from '../vulnerabilities-list';
import Interstitial from '../interstitial';
import Footer from '../footer';

const Admin = () => {
	const { isRegistered, isUserConnected } = useConnection( { skipUserConnection: true } );
	const { siteSuffix, adminUrl } = jetpackProtectInitialState;
	const securityCheckoutUrl = getProductCheckoutUrl(
		'jetpack_security_t1_yearly',
		siteSuffix,
		adminUrl,
		isUserConnected
	);
	const learnMoreUrl = getRedirectUrl( 'jetpack-protect-footer-learn-more' );

	const handleProductButton = useCallback( () => {
		window.location = securityCheckoutUrl;
	}, [ securityCheckoutUrl ] );

	// Show interstital page when Jetpack is not connected.
	if ( ! isRegistered ) {
		return (
			<AdminPage
				moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
				showHeader={ false }
				showBackground={ false }
			>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<Interstitial />
					</Col>
				</Container>
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
					<Col>
						<Summary />
					</Col>
					<Col>
						<VulnerabilitiesList />
					</Col>
				</Container>
			</AdminSectionHero>
			<Footer handleProductButton={ handleProductButton } learnMoreUrl={ learnMoreUrl } />
		</AdminPage>
	);
};

export default Admin;
