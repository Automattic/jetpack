import { AdminPage as JetpackAdminPage, Container } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import React, { useEffect } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import InterstitialPage from '../interstitial-page';
import Logo from '../logo';
import Tabs, { Tab } from '../tabs';
import styles from './styles.module.scss';
import useRegistrationWatcher from './use-registration-watcher';

export const JETPACK_SCAN = 'jetpack_scan';

const AdminPage = ( { children } ) => {
	useRegistrationWatcher();

	const { isSeen: wafSeen } = useWafData();
	const { refreshPlan, startScanOptimistically, refreshStatus } = useDispatch( STORE_ID );
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { userIsConnecting } = useConnection();
	const { run, isRegistered, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: addQueryArgs( adminUrl, { checkPlan: true } ),
		siteProductAvailabilityHandler: async () =>
			apiFetch( {
				path: 'jetpack-protect/v1/check-plan',
				method: 'GET',
			} ).then( hasRequiredPlan => hasRequiredPlan ),
	} );
	const { hasRequiredPlan } = useProtectData();

	useEffect( () => {
		if ( getQueryArg( window.location.search, 'checkPlan' ) ) {
			startScanOptimistically();
			setTimeout( () => {
				refreshPlan();
				refreshStatus( true );
			}, 5000 );
		}
	}, [ refreshPlan, refreshStatus, startScanOptimistically ] );

	useEffect( () => {
		if ( getQueryArg( window.location.search, 'redirectUser' ) ) {
			if ( ! hasRequiredPlan ) {
				const redirectUrl = 'admin.php?page=my-jetpack#/add-license';
				window.location = redirectUrl;
				return Promise.resolve( redirectUrl );
			}
		}
	}, [ hasRequiredPlan ] );

	/*
	 * Show interstital page when
	 * - Site is not registered
	 * - User is connecting
	 * - Checkout workflow has started
	 */
	if ( ! isRegistered || userIsConnecting || hasCheckoutStarted ) {
		return <InterstitialPage onScanAdd={ run } scanJustAdded={ hasCheckoutStarted } />;
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
