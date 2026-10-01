import { render, screen } from '@testing-library/react';
import { getMockRouteLinkUrl, setMockRouteSearch } from '../../../../tests/js/route-test-utils';
import { getVideosFields } from './fields';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';

// The router is built dynamically, so a field-level test has no router to mount; render `Link`
// as the anchor it becomes so `to`/`params`/`search` stay assertable, matching other field tests.
jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

setMockRouteSearch( {
	from: '2026-06-01',
	to: '2026-06-16',
	interval: 'day',
	chart_period: 'week',
} );

const video: StatsVideoPlaysComparisonItem = {
	id: 12,
	label: 'Launch video',
	plays: 11,
	impressions: 42,
	watch_time: 128.5,
	retention_rate: 61.25,
	link: 'https://example.com/video/',
	children: null,
};

/**
 * Render one of the videos table's non-metric fields for a row.
 *
 * @param fieldId - The videos field to render.
 * @param item    - The video row to render.
 * @return The RTL render result.
 */
function renderVideosField( fieldId: 'label' | 'poster', item: StatsVideoPlaysComparisonItem ) {
	const field = getVideosFields().find( candidate => candidate.id === fieldId );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const FieldRender = field?.render;

	if ( ! field || ! FieldRender ) {
		throw new Error( `Videos ${ fieldId } field render callback is unavailable` );
	}

	return render( <FieldRender item={ item } field={ field as never } /> );
}

/**
 * Render one metric field for a video row.
 *
 * @param fieldId        - The metric field to render.
 * @param item           - The video row.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The RTL render result.
 */
function renderMetricField(
	fieldId: 'plays' | 'impressions',
	item: StatsVideoPlaysComparisonItem,
	withComparison = false
) {
	const field = getVideosFields( withComparison ).find( candidate => candidate.id === fieldId );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const MetricField = field?.render;

	if ( ! field || ! MetricField ) {
		throw new Error( `Videos ${ fieldId } field render callback is unavailable` );
	}

	return render( <MetricField item={ item } field={ field as never } /> );
}

describe( 'videos fields', () => {
	it( 'renders the poster resized for a table row', () => {
		renderVideosField( 'poster', { ...video, poster: 'https://i0.wp.com/v/launch.jpg' } );

		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toHaveAttribute(
			'src',
			'https://i0.wp.com/v/launch.jpg?resize=114%2C64'
		);
	} );

	it( 'links the poster to the detail page, out of the tab order', () => {
		renderVideosField( 'poster', { ...video, poster: 'https://i0.wp.com/v/launch.jpg' } );

		const link = screen.getByRole( 'link', { hidden: true } );
		const url = getMockRouteLinkUrl( link );
		expect( url.pathname ).toBe( '/video/12' );
		expect( Object.fromEntries( url.searchParams ) ).toEqual( {
			from: '2026-06-01',
			to: '2026-06-16',
			interval: 'day',
			ref: 'videos',
		} );
		expect( link ).toHaveAttribute( 'tabindex', '-1' );
		expect( link ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'leaves the poster unlinked for a row without an ID', () => {
		renderVideosField( 'poster', {
			...video,
			id: undefined,
			poster: 'https://i0.wp.com/v/launch.jpg',
		} );

		expect( screen.queryByRole( 'link', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the placeholder for an unsafe poster URL', () => {
		renderVideosField( 'poster', { ...video, poster: 'javascript:alert(1)' } );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'report-thumbnail-placeholder' ) ).toBeInTheDocument();
	} );

	it( 'links a video title to its internal detail page, carrying the date window', () => {
		renderVideosField( 'label', video );

		const link = screen.getByRole( 'link', { name: 'Launch video' } );
		// Only the shared report-window params travel; page-owned params
		// (`chart_period`) stay behind.
		const url = getMockRouteLinkUrl( link );
		expect( url.pathname ).toBe( '/video/12' );
		expect( Object.fromEntries( url.searchParams ) ).toEqual( {
			from: '2026-06-01',
			to: '2026-06-16',
			interval: 'day',
			ref: 'videos',
		} );
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	it( 'keeps the external page link as the fallback for a row without an ID', () => {
		renderVideosField( 'label', { ...video, id: undefined } );

		// The design system's outbound marker joins the accessible name.
		const link = screen.getByRole( 'link', { name: 'Launch video(opens in a new tab)' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/video/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'does not create a detail link for a non-positive ID', () => {
		renderVideosField( 'label', { ...video, id: 0 } );

		expect(
			screen.getByRole( 'link', { name: 'Launch video(opens in a new tab)' } )
		).toHaveAttribute( 'href', 'https://example.com/video/' );
	} );

	it( 'renders plain text when a row has neither an ID nor a URL', () => {
		renderVideosField( 'label', { ...video, id: undefined, link: null } );

		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders plain text when the payload URL is unsafe', () => {
		renderVideosField( 'label', { ...video, id: undefined, link: 'javascript:alert(1)' } );

		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the report-owned untitled fallback', () => {
		renderVideosField( 'label', { ...video, id: undefined, label: undefined, link: null } );

		expect( screen.getByText( 'Untitled video' ) ).toBeInTheDocument();
	} );

	it( 'exposes searchable title and sortable metric fields', () => {
		const fields = getVideosFields();

		expect( fields.find( field => field.id === 'label' )?.enableGlobalSearch ).toBe( true );
		expect( fields.find( field => field.id === 'plays' )?.getValue?.( { item: video } ) ).toBe(
			11
		);
		expect(
			fields.find( field => field.id === 'impressions' )?.getValue?.( { item: video } )
		).toBe( 42 );
	} );

	it( 'shows plays and impressions deltas when comparison is enabled', () => {
		const comparedVideo: StatsVideoPlaysComparisonItem = {
			...video,
			plays: 20,
			previousPlays: 10,
			impressions: 42,
			previousImpressions: 28,
		};

		renderMetricField( 'plays', comparedVideo, true );
		renderMetricField( 'impressions', comparedVideo, true );

		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( '+100%' ) ).toBeInTheDocument();
		expect( screen.getByText( '42' ) ).toBeInTheDocument();
		expect( screen.getByText( '+50%' ) ).toBeInTheDocument();
	} );

	it( 'hides comparison deltas when comparison is disabled', () => {
		renderMetricField( 'plays', {
			...video,
			plays: 20,
			previousPlays: 10,
		} );

		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.queryByText( '+100%' ) ).not.toBeInTheDocument();
	} );
} );
