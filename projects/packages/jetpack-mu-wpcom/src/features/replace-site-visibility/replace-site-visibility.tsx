import ReactDOM from 'react-dom/client';
import SiteVisibility from './site-visibility';

declare global {
	interface Window {
		JETPACK_MU_WPCOM_SITE_VISIBILITY?: {
			siteId: number;
			siteSlug: string;
			isWpcomStagingSite: boolean;
			isUnlaunchedSite: boolean;
			hasSitePreviewLink: boolean;
			shareSiteLink?: string;
			shareSiteNonce: string;
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
		root.render( <SiteVisibility { ...props } /> );
	}
} );
