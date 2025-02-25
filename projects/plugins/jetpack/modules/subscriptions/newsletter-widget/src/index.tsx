import { createRoot } from '@wordpress/element';
import React from 'react';
import { NewsletterWidget } from './newsletter-widget';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'newsletter-widget-app' );

	if ( ! container ) {
		return;
	}

	// FIXME: Just to prove out the concept, we're hardcoding these values.
	const hostname = 'holdercptest2.wordpress.com';
	const adminUrl = 'https://holdercptest2.wordpress.com/wp-admin/';

	if ( ! hostname || ! adminUrl ) {
		return;
	}

	const root = createRoot( container );
	root.render( <NewsletterWidget hostname={ hostname } adminUrl={ adminUrl } /> );
} );
