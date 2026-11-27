import { useCallback } from 'react';
import { useRouteModal } from '../../compat/route-modal';
import page from '../../compat/router';
import {
	useDispatch,
	useSelector,
	getSiteAdminUrl,
	getSelectedSiteId,
	getSelectedSiteSlug,
} from '../../compat/state';
import {
	recordDSPEntryPoint,
	useDspOriginProps,
	useJetpackBlazeVersionCheck,
} from '../../lib/promote-post';
import { getAdvertisingDashboardPath } from '../utils';
import useIsRunningInWpAdmin from './use-is-running-in-wpadmin';

export interface Props {
	keyValue: string;
	entrypoint: string;
	external?: boolean;
}

const useOpenPromoteWidget = ( { keyValue, entrypoint, external }: Props ) => {
	const { openModal } = useRouteModal( 'blazepress-widget', keyValue );
	const siteId = useSelector( getSelectedSiteId );
	const isRunningInWpAdmin = useIsRunningInWpAdmin();
	const siteSlug = useSelector( getSelectedSiteSlug );
	const dspOriginProps = useDspOriginProps();
	const siteAdminUrl = useSelector( state => getSiteAdminUrl( state, siteId ) );
	// Versions that move the dashboard from tools.php to admin.php: Jetpack
	// (Automattic/jetpack#49584) and the Blaze Ads plugin (Automattic/blaze-ads#93).
	// Keep these at or above the actual release versions: a too-low gate links to
	// admin.php on sites that still serve tools.php (no back-redirect), breaking it.
	const hasNewAdminPage = useJetpackBlazeVersionCheck( siteId, '16.1', '0.10.0' );
	const adminPagePath = hasNewAdminPage ? 'admin.php' : 'tools.php';
	const dispatch = useDispatch();

	const onOpenPromoteWidget = useCallback( () => {
		dispatch( recordDSPEntryPoint( entrypoint, dspOriginProps ) );
		if ( isRunningInWpAdmin ) {
			const blazeURL = getAdvertisingDashboardPath( `/posts/promote/${ keyValue }/${ siteSlug }` );

			if ( external ) {
				const { isAtomic } = dspOriginProps;
				const query = encodeURIComponent( `blazepress-widget=${ keyValue }` );
				window.location.href = isAtomic
					? `https://jetpack.com/redirect/?source=jetpack-blaze&site=${ siteSlug }&query=${ query }`
					: `${ siteAdminUrl }${ adminPagePath }?page=advertising#!${ blazeURL }`;
			} else {
				page( blazeURL );
			}
		} else {
			openModal();
		}
	}, [
		siteSlug,
		entrypoint,
		keyValue,
		dspOriginProps,
		external,
		siteAdminUrl,
		adminPagePath,
		isRunningInWpAdmin,
		openModal,
		dispatch,
	] );

	return onOpenPromoteWidget;
};

export default useOpenPromoteWidget;
