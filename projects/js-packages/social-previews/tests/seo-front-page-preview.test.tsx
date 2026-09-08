/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
/**
 * Guards the SEO front-page preview in the Jetpack plugin's Traffic settings
 * (plugins/jetpack/_inc/client/traffic/seo.jsx), which renders the Google,
 * Facebook and X previews with the site's front-page meta description.
 *
 * These assertions mirror that screen's exact call sites, so a change to the
 * preview components that would blank out the front-page description shows up
 * here rather than in the plugin.
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as React from 'react';
import { FacebookLinkPreview } from '../src/facebook-preview/link-preview';
import { GoogleSearchPreview } from '../src/google-search-preview';
import { TwitterLinkPreview } from '../src/twitter-preview/link-preview';

// The values seo.jsx feeds in.
const SITE_TITLE = 'My Test Site';
const SITE_URL = 'https://example.com';
const META_DESCRIPTION = 'The front page meta description from the SEO settings form.';
const SITE_IMAGE = 'https://example.com/image.png';

describe( 'SEO front-page preview', () => {
	it( 'Google preview still shows the front-page description', () => {
		const { container } = render(
			<GoogleSearchPreview
				siteIcon=""
				siteTitle={ SITE_TITLE }
				title={ SITE_TITLE }
				url={ SITE_URL }
				description={ META_DESCRIPTION }
			/>
		);

		expect( container ).toHaveTextContent( META_DESCRIPTION );
	} );

	it( 'Facebook preview still shows the front-page description', () => {
		const { container } = render(
			<FacebookLinkPreview
				title={ SITE_TITLE }
				url={ SITE_URL }
				type="website"
				imageMode="landscape"
				description={ META_DESCRIPTION }
				image={ SITE_IMAGE }
			/>
		);

		const descEl = container.querySelector( '.facebook-preview__description' );

		expect( descEl ).toBeInTheDocument();
		expect( descEl ).toHaveTextContent( META_DESCRIPTION );
	} );

	it( 'Facebook preview still renders the title and image', () => {
		const { container } = render(
			<FacebookLinkPreview
				title={ SITE_TITLE }
				url={ SITE_URL }
				type="website"
				imageMode="landscape"
				description={ META_DESCRIPTION }
				image={ SITE_IMAGE }
			/>
		);

		expect( container.querySelector( '.facebook-preview__title' ) ).toHaveTextContent( SITE_TITLE );
		expect(
			container.querySelector( `.facebook-preview__image img[src="${ SITE_IMAGE }"]` )
		).toBeInTheDocument();
	} );

	it( 'X preview renders title and domain (X shows no description)', () => {
		const { container } = render(
			<TwitterLinkPreview
				title={ SITE_TITLE }
				url={ SITE_URL }
				description={ META_DESCRIPTION }
				image={ SITE_IMAGE }
			/>
		);

		// The card renders, with the title overlaid on the image.
		expect( container.querySelector( '.twitter-preview__card' ) ).toBeInTheDocument();
		expect( container ).toHaveTextContent( SITE_TITLE );
		expect( container ).toHaveTextContent( 'example.com' );
	} );
} );
