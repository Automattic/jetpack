import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useEffect, useRef } from 'react';
import { RUNNING_ON_PLAN_STATUSES } from '../../components/my-jetpack-tab-panel/features/feature-state';
import { refreshSidebar } from '../../components/my-jetpack-tab-panel/features/use-sidebar-sync';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { linksTo } from '../../utils/admin-menu-sync';

/**
 * The wp-admin page a manage URL opens, if it is one.
 *
 * @param url - A product's manage URL.
 * @return The `page` argument, or an empty string.
 */
function adminPageOf( url: string | undefined ): string {
	if ( ! url ) {
		return '';
	}

	try {
		const link = new URL( url, window.location.href );
		const adminPage = new URL( getAdminUrl( 'admin.php' ), window.location.href );

		return link.origin === adminPage.origin && link.pathname === adminPage.pathname
			? ( link.searchParams.get( 'page' ) ?? '' )
			: '';
	} catch {
		return '';
	}
}

/**
 * The products behind features whose plan, not a switch, adds their page to the sidebar.
 *
 * @return Product slugs.
 */
function getPlanDrivenProducts(): string[] {
	const features = getMyJetpackWindowInitialState( 'mainFeatures' )?.features;

	return Array.isArray( features )
		? features.filter( feature => feature.plan_driven ).map( feature => feature.product )
		: [];
}

/**
 * Refresh the sidebar once when a plan-driven feature's plan reached the site after this page drew it.
 *
 * Landing back from checkout, My Jetpack can know about a purchase before the sidebar,
 * rendered earlier in the same request, shows the page that purchase adds.
 */
export function usePaidMenuSync() {
	const { data: products } = useAllProducts();
	const refreshed = useRef( false );

	const paidPages = getPlanDrivenProducts()
		.map( slug => products[ slug ] )
		.filter(
			product =>
				product?.hasPaidPlanForProduct && RUNNING_ON_PLAN_STATUSES.includes( product.status )
		)
		.map( product => adminPageOf( product.manageUrl ) )
		.filter( Boolean )
		.sort()
		.join( ',' );

	useEffect( () => {
		const live = document.getElementById( 'adminmenu' );

		if ( ! live || ! paidPages || refreshed.current ) {
			return;
		}

		const items = Array.from( live.querySelectorAll( 'li' ) );
		const missing = paidPages
			.split( ',' )
			.some(
				page => ! items.some( item => linksTo( item, getAdminUrl( `admin.php?page=${ page }` ) ) )
			);

		if ( missing ) {
			// Once per page view, so a page no menu ever carries costs one fetch, not one per render.
			refreshed.current = true;
			refreshSidebar( live, new AbortController().signal ).catch( () => {} );
		}
	}, [ paidPages ] );
}
