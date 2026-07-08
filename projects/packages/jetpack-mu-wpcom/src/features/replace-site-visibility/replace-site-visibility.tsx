import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import LaunchCelebrationModal from './launch-celebration-modal';
import LaunchSite from './launch-site';
import SiteVisibility from './site-visibility';
import type { SitePreviewLinkObject } from './site-preview-link';

declare global {
	interface Window {
		JETPACK_MU_WPCOM_SITE_VISIBILITY?: {
			homeUrl: string;
			siteTitle: string;
			blogId: number;
			isWpcomStagingSite: boolean;
			isUnlaunchedSite: boolean;
			hasSitePreviewLink: boolean;
			sitePreviewLink?: SitePreviewLinkObject;
			sitePreviewLinkNonce: string;
			blogPublic: number;
			wpcomComingSoon: number;
			wpcomPublicComingSoon: number;
			wpcomDataSharingOptOut: boolean;
			siteDomain: string;
			sitePlan?: { product_slug: string };
			hasCustomDomain: boolean;
		};
	}
}

const queryClient = new QueryClient();

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'wpcom-site-visibility' );
	const props = typeof window === 'object' ? window.JETPACK_MU_WPCOM_SITE_VISIBILITY : null;
	if ( container && props ) {
		const root = createRoot( container );
		if ( props.isUnlaunchedSite ) {
			root.render(
				<QueryClientProvider client={ queryClient }>
					<LaunchSite { ...props } />
				</QueryClientProvider>
			);
		} else {
			root.render(
				<>
					<SiteVisibility { ...props } />
					<LaunchCelebrationModal { ...props } />
				</>
			);
		}
	}
} );
