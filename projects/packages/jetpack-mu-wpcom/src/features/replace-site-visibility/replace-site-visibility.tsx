import ReactDOM from 'react-dom/client';
import SiteVisibility from './site-visibility';

declare global {
	interface Window {
		JETPACK_MU_WPCOM_SITE_VISIBILITY?: {
			siteId: number;
			siteSlug: string;
			shareSiteLink?: string;
			shareSiteNonce: string;
		};
	}
}

const selectors = {
	WPCOM_SITE_VISIBILITY: '#wpcom_site_visibility',
};

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( selectors.WPCOM_SITE_VISIBILITY );
	const props = typeof window === 'object' ? window.JETPACK_MU_WPCOM_SITE_VISIBILITY : null;
	if ( container && props ) {
		const root = ReactDOM.createRoot( container );
		root.render( <SiteVisibility { ...props } /> );
	}
} );
