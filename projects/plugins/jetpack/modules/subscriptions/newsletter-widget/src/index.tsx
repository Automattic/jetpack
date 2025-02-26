import { createRoot } from '@wordpress/element';
import React from 'react';
import { NewsletterWidget } from './newsletter-widget';

declare global {
	interface Window {
		jetpackNewsletterWidgetConfigData?: {
			hostname: string;
			adminUrl: string;
		};
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'newsletter-widget-app' );

	if ( ! container ) {
		return;
	}

	const { hostname, adminUrl } = window.jetpackNewsletterWidgetConfigData || {};

	if ( ! hostname || ! adminUrl ) {
		return;
	}

	const root = createRoot( container );
	root.render( <NewsletterWidget hostname={ hostname } adminUrl={ adminUrl } /> );
} );
