import { AdminPage as JetpackAdminPage, Container } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import React, { useEffect } from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import InterstitialPage from '../interstitial-page';
import Logo from '../logo';
import Tabs, { Tab } from '../tabs';
import styles from './styles.module.scss';
import useRegistrationWatcher from './use-registration-watcher';

const AdminPage = ( { children } ) => {
	useRegistrationWatcher();

	const { isSeen: wafSeen } = useWafData();
	const { refreshPlan, startScanOptimistically, refreshStatus } = useDispatch( STORE_ID );
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run, isRegistered, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: addQueryArgs( adminUrl, { checkPlan: true } ),
		siteProductAvailabilityHandler: async () =>
			apiFetch( {
				path: 'jetpack-protect/v1/check-plan',
				method: 'GET',
			} ).then( hasRequiredPlan => hasRequiredPlan ),
	} );

	useEffect( () => {
		if ( getQueryArg( window.location.search, 'checkPlan' ) ) {
			startScanOptimistically();
			setTimeout( () => {
				refreshPlan();
				refreshStatus( true );
			}, 5000 );
		}
	}, [ refreshPlan, refreshStatus, startScanOptimistically ] );

	/*
	 * Show interstital page when
	 * - Site is not registered
	 * - Checkout workflow has started
	 */
	if ( ! isRegistered || hasCheckoutStarted ) {
		return <InterstitialPage onScanAdd={ run } />;
	}

	return (
		<JetpackAdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
			<Container horizontalSpacing={ 0 }>
				<Tabs className={ styles.navigation }>
					<Tab link="/" label={ __( 'Scan', 'jetpack-protect' ) } />
					<Tab
						link="/firewall"
						label={
							<>
								{ __( 'Firewall', 'jetpack-protect' ) }
								{ wafSeen === false && (
									<span className={ styles.badge }>{ __( 'New', 'jetpack-protect' ) }</span>
								) }
							</>
						}
					/>
				</Tabs>
			</Container>
			{ children }
		</JetpackAdminPage>
	);
};

export default AdminPage;
