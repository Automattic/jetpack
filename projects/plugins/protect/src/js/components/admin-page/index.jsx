/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import Summary from '../summary';
import VulnerabilitiesList from '../vulnerabilities-list';
import Interstitial from '../interstitial';
import { STORE_ID } from '../../state/store';
import Footer from '../footer';

export const SECURITY_BUNDLE = 'jetpack_security_t1_yearly';

const Admin = () => {
	const { isRegistered } = useConnection( { skipUserConnection: true } );
	useRegistrationWatcher();

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

export default Admin;
