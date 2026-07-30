import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import SiteVisibilityCard from '../site-visibility-card';
import type { OverviewResponse } from '../../../data/overview-types';

type Visibility = OverviewResponse[ 'site_visibility' ];

/**
 * Build a site-visibility payload.
 *
 * @param overrides - Fields to override on the default payload.
 * @return The visibility payload.
 */
const buildVisibility = ( overrides: Partial< Visibility > = {} ): Visibility => ( {
	search_engines_visible: true,
	sitemap_active: true,
	seo_tools_active: true,
	...overrides,
} );

describe( 'SiteVisibilityCard', () => {
	it( 'reports indexing and the sitemap, and nothing else', () => {
		render( <SiteVisibilityCard data={ buildVisibility() } onManage={ jest.fn() } /> );

		expect( screen.getByText( 'Open to search engines' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sitemap published' ) ).toBeInTheDocument();
		// The Overview renders `EnableSeoCard` in place of these cards when SEO tools
		// are off, so an "SEO tools active" row could only ever read "active".
		expect( screen.queryByText( /SEO tools/ ) ).not.toBeInTheDocument();
	} );

	it( 'reports the closed state', () => {
		render(
			<SiteVisibilityCard
				data={ buildVisibility( { search_engines_visible: false } ) }
				onManage={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Closed to search engines' ) ).toBeInTheDocument();
	} );

	it( 'shows the sitemap as unpublished while the site is closed to search', () => {
		// A sitemap can't be served while indexing is blocked, so the card reports the
		// effective state rather than the stored toggle.
		render(
			<SiteVisibilityCard
				data={ buildVisibility( { search_engines_visible: false, sitemap_active: true } ) }
				onManage={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Sitemap not published' ) ).toBeInTheDocument();
	} );

	it( 'keeps the row wording distinct from the per-post Content SEO ring', () => {
		// The Content SEO card counts posts with "Visible to search engines"; this card
		// is about the whole site. Near-identical wording on one screen would conflate
		// a site-wide switch with a per-post count.
		render( <SiteVisibilityCard data={ buildVisibility() } onManage={ jest.fn() } /> );

		expect( screen.queryByText( /Visible to search engines/ ) ).not.toBeInTheDocument();
	} );
} );
