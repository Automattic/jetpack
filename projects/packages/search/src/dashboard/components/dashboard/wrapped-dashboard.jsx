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
import { Spinner } from '@automattic/jetpack-components';
import useConnection from './use-connection';
import { STORE_ID } from 'store';
import UpsellPage from './upsell-page';
import SearchConnectionPage from './connection-page';
import SearchDashboard from './index';

/**
 * Return appropriate components.
 *
 * @returns {React.Component} WrappedDashboard component.
 */
export default function WrappedDashboard() {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );
	useSelect( select => select( STORE_ID ).getSearchStats(), [] );
	useSelect( select => select( STORE_ID ).getSearchPricing(), [] );
	const { connectionStatus } = useConnection();

	const supportsSearch = useSelect( select => select( STORE_ID ).supportsSearch() );

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
		return <SearchConnectionPage />;
	}

	if ( ! supportsSearch ) {
		return <UpsellPage />;
	}

	return <SearchDashboard />;
}
