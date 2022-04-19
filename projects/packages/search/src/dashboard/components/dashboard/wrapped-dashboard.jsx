/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { useSelect, select as syncSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { AdminSectionHero, Container, Col, Spinner } from '@automattic/jetpack-components';
import useConnection from './use-connection';
import SearchDashboard from './index';
import { STORE_ID } from 'store';

/**
 * Return Search Dashboard if connected, otherwise the connection screen.
 *
 * @returns {React.Component} SearchDashboardWithConnection component.
 */
export default function SearchDashboardWithConnection() {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );
	useSelect( select => select( STORE_ID ).getSearchStats(), [] );
	useSelect( select => select( STORE_ID ).getSearchPricing(), [] );
	const { connectionStatus, renderConnectScreen, renderConnectionFooter } = useConnection();

	const isFullyConnected =
		Object.keys( connectionStatus ).length &&
		connectionStatus.isUserConnected &&
		connectionStatus.isRegistered;

	const isLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' ) ||
			select( STORE_ID ).isResolving( 'getSearchModuleStatus' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchModuleStatus' ) ||
			select( STORE_ID ).isResolving( 'getSearchStats' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchStats' ) ||
			select( STORE_ID ).isResolving( 'getSearchPricing' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPricing' )
	);

	const initializeAnalytics = () => {
		const tracksUser = syncSelect( STORE_ID ).getWpcomUser();
		const blogId = syncSelect( STORE_ID ).getBlogId();

		if ( tracksUser ) {
			analytics.initialize( tracksUser.ID, tracksUser.login, {
				blog_id: blogId,
			} );
		}
	};

	useMemo( () => {
		const apiRootUrl = syncSelect( STORE_ID ).getAPIRootUrl();
		const apiNonce = syncSelect( STORE_ID ).getAPINonce();
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		initializeAnalytics();
		analytics.tracks.recordEvent( 'jetpack_search_admin_page_view', {
			current_version: syncSelect( STORE_ID ).getVersion(),
		} );
	}, [] );

	if ( isLoading ) {
		return (
			<Spinner className="jp-search-dashboard-page-loading-spinner" color="#000" size={ 32 } />
		);
	}

	if ( ! isFullyConnected ) {
		return (
			<div className="jp-search-dashboard-connection-screen">
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							{ renderConnectScreen() }
						</Col>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							{ renderConnectionFooter() }
						</Col>
					</Container>
				</AdminSectionHero>
			</div>
		);
	}

	return <SearchDashboard />;
}
