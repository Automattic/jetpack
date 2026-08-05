import { render, screen } from '@testing-library/react';
import { getVideosFields } from './fields';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

// The router is built dynamically at runtime, so a field-level test has no
// router to mount. Render `Link` as the anchor it becomes, keeping `to`/
// `params`/`search` assertable, matching the other report field tests.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		search,
		children,
	}: {
		to: string;
		params: Record< string, string >;
		search?: Record< string, string >;
		children: ReactNode;
	} ) => {
		const path = to.replace( /\$(\w+)/g, ( _match, key ) => params[ key ] );
		const query = new URLSearchParams( search ?? {} ).toString();

		return <a href={ query ? `${ path }?${ query }` : path }>{ children }</a>;
	},
	useSearch: () => ( {
		from: '2026-06-01',
		to: '2026-06-16',
		// A page-owned param the detail link must not carry along.
		chart_period: 'week',
	} ),
} ) );

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
 * Render the videos table's title field for one row.
 *
 * @param item - The video row to render.
 * @return The RTL render result.
 */
function renderTitleField( item: StatsVideoPlaysComparisonItem ) {
	const field = getVideosFields().find( candidate => candidate.id === 'label' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const TitleField = field?.render;

	if ( ! field || ! TitleField ) {
		throw new Error( 'Videos title field render callback is unavailable' );
	}

	return render( <TitleField item={ item } field={ field as never } /> );
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
	it( 'links a video title to its internal detail page, carrying the date window', () => {
		renderTitleField( video );

		const link = screen.getByRole( 'link', { name: 'Launch video' } );
		// Only the shared report-window params travel; page-owned params
		// (`chart_period`) stay behind.
		expect( link ).toHaveAttribute( 'href', '/video/12?from=2026-06-01&to=2026-06-16' );
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	it( 'keeps the external page link as the fallback for a row without an ID', () => {
		renderTitleField( { ...video, id: undefined } );

		const link = screen.getByRole( 'link', { name: 'Launch video' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/video/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'does not create a detail link for a non-positive ID', () => {
		renderTitleField( { ...video, id: 0 } );

		expect( screen.getByRole( 'link', { name: 'Launch video' } ) ).toHaveAttribute(
			'href',
			'https://example.com/video/'
		);
	} );

	it( 'renders plain text when a row has neither an ID nor a URL', () => {
		renderTitleField( { ...video, id: undefined, link: null } );

		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders plain text when the payload URL is unsafe', () => {
		renderTitleField( { ...video, id: undefined, link: 'javascript:alert(1)' } );

		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the report-owned untitled fallback', () => {
		renderTitleField( { ...video, id: undefined, label: undefined, link: null } );

		expect( screen.getByText( 'Untitled video' ) ).toBeInTheDocument();
	} );

	it( 'exposes searchable title and sortable metric fields', () => {
		const fields = getVideosFields();

		expect( fields.map( field => field.id ) ).toEqual( [ 'label', 'plays', 'impressions' ] );
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
