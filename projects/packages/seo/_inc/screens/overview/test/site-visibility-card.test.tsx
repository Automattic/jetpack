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

/**
 * The state colour of the dot beside a row — the card's at-a-glance signal. Read
 * from `data-status` on the row, because the colour itself lives in a CSS module
 * that jest stubs away.
 *
 * @param label - The row's visible label.
 * @return The row's status.
 */
const dotFor = ( label: string ) => screen.getByText( label ).getAttribute( 'data-status' );

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

	it( 'renders no subtitle element when the card passes none', () => {
		// Only Content SEO passes a subtitle. Without this, dropping the `subtitle &&`
		// guard in CardHeaderIcon would put an empty <p> — carrying the subtitle's top
		// margin and indent — under every other card title, and CI would stay green.
		render( <SiteVisibilityCard data={ buildVisibility() } onManage={ jest.fn() } /> );

		expect( screen.queryByRole( 'paragraph' ) ).not.toBeInTheDocument();
	} );

	it( 'colours the dots to match the state each row reports', () => {
		// The dot is the at-a-glance signal on this card, and nothing else asserts it —
		// every colour could be inverted and the suite would stay green.
		const view = render( <SiteVisibilityCard data={ buildVisibility() } onManage={ jest.fn() } /> );
		expect( dotFor( 'Open to search engines' ) ).toBe( 'ok' );
		expect( dotFor( 'Sitemap published' ) ).toBe( 'ok' );
		view.unmount();

		render(
			<SiteVisibilityCard
				data={ buildVisibility( { search_engines_visible: false } ) }
				onManage={ jest.fn() }
			/>
		);
		// Closed to search is an error state; an unpublished sitemap is a warning.
		expect( dotFor( 'Closed to search engines' ) ).toBe( 'err' );
		expect( dotFor( 'Sitemap not published' ) ).toBe( 'warn' );
	} );
} );
