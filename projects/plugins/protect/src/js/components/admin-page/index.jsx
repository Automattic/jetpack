/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import Summary from '../summary';
import VulnerabilitiesList from '../vulnerabilities-list';
import Interstitial from '../interstitial';
import Footer from '../footer';

export const SECURITY_BUNDLE = 'jetpack_security_t1_yearly';

const Admin = () => {
	const { isRegistered } = useConnection( { skipUserConnection: true } );

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
			<Footer />
		</AdminPage>
	);
};

export default Admin;
