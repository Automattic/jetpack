/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { useSelect, select as syncSelect } from '@wordpress/data';
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import useConnection from 'hooks/use-connection';
import { STORE_ID } from 'store';
import SearchConnectionPage from 'components/pages/connection-page';
import UpsellPage from 'components/pages/upsell-page';
import SearchDashboardPage from 'components/pages/dashboard-page';

/**
 * Return appropriate components.
 *
 * @returns {React.Component} WrappedDashboard component.
 */
export default function WrappedDashboard() {
	const { isFullyConnected } = useConnection();

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

	return (
		<>
			{ ! isFullyConnected && <SearchConnectionPage /> }
			{ isFullyConnected && <AfterConnectionPage /> }
		</>
	);
}

/**
 * Returns SearchDashboard component if supports search otherwise UpsellPage component
 *
 * @returns {React.Component} AfterConnectionPage component.
 */
function AfterConnectionPage() {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );

	const supportsSearch = useSelect( select => select( STORE_ID ).supportsSearch() );

	const isLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' )
	);

	return (
		<>
			{ supportsSearch && <SearchDashboardPage isLoading={ isLoading } /> }
			{ ! supportsSearch && <UpsellPage isLoading={ isLoading } /> }
		</>
	);
}
