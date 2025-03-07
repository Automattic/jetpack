import * as jpDataUtils from '@automattic/jetpack-script-data';
import { createRoot } from '@wordpress/element';
import { NewsletterWidget } from './components/newsletter-widget';
import type { SubscriberTotalsByDate } from './types';

declare global {
	interface Window {
		jetpackNewsletterWidgetConfigData?: {
			emailSubscribers?: number;
			paidSubscribers?: number;
			allSubscribers?: number;
			subscriberTotalsByDate?: SubscriberTotalsByDate;
		};
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'newsletter-widget-app' );

	if ( ! container ) {
		return;
	}

	const { emailSubscribers, paidSubscribers, allSubscribers, subscriberTotalsByDate } =
		window.jetpackNewsletterWidgetConfigData || {};
	const { suffix: site } = jpDataUtils.getSiteData();
	const adminUrl = jpDataUtils.getAdminUrl();
	const isWpcomSite = jpDataUtils.isWpcomPlatformSite();

	if ( ! site || ! adminUrl || isWpcomSite === undefined ) {
		return;
	}

	const root = createRoot( container );
	root.render(
		<NewsletterWidget
			site={ site }
			adminUrl={ adminUrl }
			isWpcomSite={ isWpcomSite }
			emailSubscribers={ emailSubscribers }
			paidSubscribers={ paidSubscribers }
			allSubscribers={ allSubscribers }
			subscriberTotalsByDate={ subscriberTotalsByDate }
		/>
	);
} );
