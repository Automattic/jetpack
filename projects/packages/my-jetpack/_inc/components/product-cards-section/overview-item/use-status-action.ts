import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../../constants';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import useProduct from '../../../data/products/use-product';
import useConnectSite from '../../../hooks/use-connect-site';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../../hooks/use-my-jetpack-navigate';
import type { OverviewItemLink } from '.';

/**
 * The link for a product that isn't active: it connects, activates or adds the product, as the product card's button does.
 *
 * @param {JetpackModuleWithCard} slug  - The product slug.
 * @param {string}                label - The label for activating or adding the product.
 * @return {{action: OverviewItemLink | undefined, isPending: boolean}} The link, left out while it is pending.
 */
const useStatusAction = ( slug: JetpackModuleWithCard, label: string ) => {
	const { detail } = useProduct( slug );
	const { status, requiresUserConnection } = detail || {};
	const { isRegistered, isUserConnected, siteIsRegistering } = useMyJetpackConnection();
	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const { connectSite } = useConnectSite( {
		tracksInfo: { event: 'jetpack_myjetpack_product_card_fix_site_connection', properties: {} },
	} );

	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}
		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
	] );

	const handleConnectSite = useCallback( () => connectSite( undefined ), [ connectSite ] );

	const isPending =
		isActivating || ( siteIsRegistering && status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR );
	let action: OverviewItemLink | undefined;
	switch ( status ) {
		case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
			action = { label: __( 'Connect', 'jetpack-my-jetpack' ), onClick: handleConnectSite };
			break;
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
			action = { label: __( 'Connect', 'jetpack-my-jetpack' ), href: getUserConnectionUrl() };
			break;
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.MODULE_DISABLED:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
			action = { label, onClick: handleActivate };
			break;
		default:
			action = { label, href: `#/add-${ slug }` };
	}

	return { action: isPending ? undefined : action, isPending };
};

export default useStatusAction;
