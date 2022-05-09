/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	H3,
	Text,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import Summary from '../summary';
import VulnerabilitiesList from '../vulnerabilities-list';
import Interstitial from '../interstitial';
import { STORE_ID } from '../../state/store';
import Footer from '../footer';
import useProtectData from '../../hooks/use-protect-data';
import inProgressImage from './in-progress.png';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Logo from '../logo';
import AlertSVGIcon from '../alert-icon';
import styles from './styles.module.scss';

export const SECURITY_BUNDLE = 'jetpack_security_t1_yearly';

const InterstitialPage = ( { run, hasCheckoutStarted } ) => {
	return (
		<AdminPage
			moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
			showHeader={ false }
			showBackground={ false }
		>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col sm={ 4 } md={ 8 } lg={ 12 }>
					<Interstitial onSecurityAdd={ run } securityJustAdded={ hasCheckoutStarted } />
				</Col>
			</Container>
		</AdminPage>
	);
};

const ProtectAdminPage = () => {
	const { lastChecked, currentStatus, errorCode, errorMessage } = useProtectData();
	// Track view for Protect admin page.
	useAnalyticsTracks( { pageViewEventName: 'protect_admin' } );

	// Error
	if ( 'error' === currentStatus ) {
		let displayErrorMessage = errorMessage
			? `${ errorMessage } (${ errorCode }).`
			: __( 'We are having problems scanning your site.', 'jetpack-protect' );
		displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

		return (
			<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
						<Col sm={ 4 } md={ 4 } lg={ 6 }>
							<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } />
							<H3>{ __( 'We’re having problems scanning your site', 'jetpack-protect' ) }</H3>
							<Text>{ displayErrorMessage }</Text>
						</Col>
						<Col sm={ 0 } md={ 0 } lg={ 1 }></Col>
						<Col sm={ 4 } md={ 3 } lg={ 5 }>
							<img src={ inProgressImage } alt="" />
						</Col>
					</Container>
				</AdminSectionHero>
				<Footer />
			</AdminPage>
		);
	}

	// When there's no information yet. Usually when the plugin was just activated
	if ( ! lastChecked ) {
		return (
			<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
						<Col sm={ 4 } md={ 4 } lg={ 6 }>
							<H3 mt={ 8 }>{ __( 'Your results will be ready soon', 'jetpack-protect' ) }</H3>
							<Text>
								{ __(
									'We are scanning for security threats from our more than 22,000 listed vulnerabilities, powered by WPScan. This could take a few seconds.',
									'jetpack-protect'
								) }
							</Text>
						</Col>
						<Col sm={ 0 } md={ 0 } lg={ 1 }></Col>
						<Col sm={ 4 } md={ 3 } lg={ 5 }>
							<img src={ inProgressImage } alt="" />
						</Col>
					</Container>
				</AdminSectionHero>
				<Footer />
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
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

const Admin = () => {
	useRegistrationWatcher();
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run, isRegistered, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: SECURITY_BUNDLE,
		redirectUrl: adminUrl,
	} );

	/*
	 * Show interstital page when
	 * - Site is not registered
	 * - Checkout workflow has started
	 */
	if ( ! isRegistered || hasCheckoutStarted ) {
		return <InterstitialPage run={ run } hasCheckoutStarted={ hasCheckoutStarted } />;
	}

	return <ProtectAdminPage />;
};

export default Admin;
