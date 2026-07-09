import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { useSelect, select as syncSelect } from '@wordpress/data';
import { useMemo } from 'react';
import SearchConnectionPage from 'components/pages/connection-page';
import SearchDashboardPage from 'components/pages/dashboard-page';
import UpsellPage from 'components/pages/upsell-page';
import useConnection from 'hooks/use-connection';
import { STORE_ID } from 'store';

/**
 * Return appropriate components.
 *
 * @return {import('react').Component} WrappedDashboard component.
 */
export default function WrappedDashboard() {
	const { isFullyConnected } = useConnection();
	// Introduce the gate for new pricing with URL parameter `new_pricing_202208=1`
	const isNewPricing = useSelect( select => select( STORE_ID ).isNewPricing202208(), [] );

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
		const wpcomOriginApiUrl = syncSelect( STORE_ID ).getWpcomOriginApiUrl();
		const apiNonce = syncSelect( STORE_ID ).getAPINonce();
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		wpcomOriginApiUrl && restApi.setWpcomOriginApiUrl( wpcomOriginApiUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		initializeAnalytics();
		analytics.tracks.recordEvent( 'jetpack_search_admin_page_view', {
			current_version: syncSelect( STORE_ID ).getVersion(),
		} );
	}, [] );

	return (
		<>
			{ ! isFullyConnected && ! isNewPricing && <SearchConnectionPage /> }
			{ ( isFullyConnected || isNewPricing ) && <WrappedDashboard202208 /> }
		</>
	);
}

/**
 * Returns AfterConnectionPage component if site is fully connected otherwise UpsellPage component.
 *
 * @return {import('react').Component} NewWrappedDashboard component.
 */
function WrappedDashboard202208() {
	const { isFullyConnected } = useConnection();

	return (
		<>
			{ isFullyConnected && <AfterConnectionPage /> }
			{ ! isFullyConnected && <UpsellPage /> }
		</>
	);
}

/**
 * Returns SearchDashboardPage component if instant search is supported, otherwise UpsellPage.
 *
 * Gated on `supportsInstantSearch` rather than `supportsSearch` so that hosts
 * which surface classic search "for free" — notably Atomic, where the
 * Instant Search toggle is forced-disabled — land on the pricing page
 * instead of the SearchDashboardPage's mocked-only Overview tab.
 *
 * @return {import('react').Component} AfterConnectionPage component.
 */
function AfterConnectionPage() {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	const supportsInstantSearch = useSelect( select => select( STORE_ID ).supportsInstantSearch() );

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' )
	);

	return (
		<>
			{ supportsInstantSearch && <SearchDashboardPage isLoading={ isPageLoading } /> }
			{ ! supportsInstantSearch && <UpsellPage isLoading={ isPageLoading } /> }
		</>
	);
}
