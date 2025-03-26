import { getRedirectUrl } from '@automattic/jetpack-components';
import { useCallback, useContext } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import { NOTICE_SITE_CONNECTION_ERROR } from '../../context/notices/noticeTemplates';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useAnalytics from '../use-analytics';
import type { TracksEvent, TracksProperties } from '../use-analytics';
import type { MouseEvent } from 'react';

interface useConnectSiteProps {
	tracksInfo: {
		event: TracksEvent;
		properties: TracksProperties;
	};
	skipPricing?: boolean;
}

const useConnectSite = ( { tracksInfo }: useConnectSiteProps ) => {
	const { event, properties: tracksEventData } = tracksInfo;

	const { setNotice, resetNotice } = useContext( NoticeContext );

	const { recordEvent } = useAnalytics();
	const { refetch: refetchOwnershipData } = useProductsByOwnership();

	const { siteSuffix, adminUrl, myJetpackCheckoutUri } = getMyJetpackWindowInitialState();
	const redirectUri = `&redirect_to=${ myJetpackCheckoutUri }`;

	const connectAfterCheckoutUrl = `?connect_after_checkout=true&admin_url=${ encodeURIComponent(
		adminUrl
	) }&from_site_slug=${ siteSuffix }&source=my-jetpack`;
	const query = `${ connectAfterCheckoutUrl }${ redirectUri }&unlinked=1`;
	const jetpackPlansPath = getRedirectUrl( 'jetpack-my-jetpack-site-only-plans', { query } );
	const { handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri,
	} );

	const connectSite = useCallback(
		async ( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();

			setTimeout( () => {
				window.scrollTo( {
					top: 0,
					left: 0,
					behavior: 'smooth',
				} );
			}, 100 );

			recordEvent( `${ event }_click`, tracksEventData );

			try {
				await handleRegisterSite();

				recordEvent( `${ event }_success`, tracksEventData );

				window.location.href = jetpackPlansPath;
			} catch {
				setNotice( NOTICE_SITE_CONNECTION_ERROR, resetNotice );
			} finally {
				refetchOwnershipData();
			}
		},
		[
			handleRegisterSite,
			jetpackPlansPath,
			recordEvent,
			refetchOwnershipData,
			resetNotice,
			setNotice,
			tracksEventData,
			event,
		]
	);

	return { connectSite };
};

export default useConnectSite;
