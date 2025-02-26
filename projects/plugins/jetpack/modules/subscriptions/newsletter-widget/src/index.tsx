import * as jpDataUtils from '@automattic/jetpack-script-data';
import { createRoot } from '@wordpress/element';
import React from 'react';
import { NewsletterWidget } from './newsletter-widget';

declare global {
	interface Window {
		jetpackNewsletterWidgetConfigData?: {
			emailSubscribers?: number;
			paidSubscribers?: number;
		};
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'newsletter-widget-app' );

	if ( ! container ) {
		return;
	}

	const { emailSubscribers, paidSubscribers } = window.jetpackNewsletterWidgetConfigData || {};
	const { suffix: site } = jpDataUtils.getSiteData();
	const adminUrl = jpDataUtils.getAdminUrl();

	if ( ! site || ! adminUrl ) {
		return;
	}

	const root = createRoot( container );
	root.render(
		<NewsletterWidget
			site={ site }
			adminUrl={ adminUrl }
			emailSubscribers={ emailSubscribers }
			paidSubscribers={ paidSubscribers }
		/>
	);
} );
