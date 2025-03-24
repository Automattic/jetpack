import ReactDOM from 'react-dom/client';
import LaunchSite from './launch-site';
import SiteVisibility from './site-visibility';
import type { SitePreviewLinkObject } from './site-preview-link';

declare global {
	interface Window {
		JETPACK_MU_WPCOM_SITE_VISIBILITY?: {
			homeUrl: string;
			siteTitle: string;
			isWpcomStagingSite: boolean;
			isUnlaunchedSite: boolean;
			hasSitePreviewLink: boolean;
			sitePreviewLink?: SitePreviewLinkObject;
			sitePreviewLinkNonce: string;
			blogPublic: number;
			wpcomComingSoon: number;
			wpcomPublicComingSoon: number;
			wpcomDataSharingOptOut: boolean;
		};
	}
}

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'wpcom-site-visibility' );
	const props = typeof window === 'object' ? window.JETPACK_MU_WPCOM_SITE_VISIBILITY : null;
	if ( container && props ) {
		const root = ReactDOM.createRoot( container );
		if ( props.isUnlaunchedSite ) {
			root.render( <LaunchSite { ...props } /> );
		} else {
			root.render( <SiteVisibility { ...props } /> );
		}
	}
} );
