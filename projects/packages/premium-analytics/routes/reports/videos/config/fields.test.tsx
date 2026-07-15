import { render, screen } from '@testing-library/react';
import { getVideosFields } from './fields';
import type { StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

const video: StatsVideoPlaysItem = {
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
function renderTitleField( item: StatsVideoPlaysItem ) {
	const field = getVideosFields().find( candidate => candidate.id === 'title' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` here is the DataViews field render component, not RTL's render result.
	const TitleField = field?.render;

	if ( ! field || ! TitleField ) {
		throw new Error( 'Videos title field render callback is unavailable' );
	}

	return render( <TitleField item={ item } field={ field as never } /> );
}

describe( 'videos fields', () => {
	it( 'links a video title to the payload URL', () => {
		renderTitleField( video );

		const link = screen.getByRole( 'link', { name: 'Launch video' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/video/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'renders plain text when the payload has no URL', () => {
		renderTitleField( { ...video, link: null } );

		expect( screen.getByText( 'Launch video' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'exposes searchable title and sortable metric fields', () => {
		const fields = getVideosFields();

		expect( fields.map( field => field.id ) ).toEqual( [ 'title', 'plays', 'impressions' ] );
		expect( fields.find( field => field.id === 'title' )?.enableGlobalSearch ).toBe( true );
		expect( fields.find( field => field.id === 'plays' )?.getValue?.( { item: video } ) ).toBe(
			11
		);
		expect(
			fields.find( field => field.id === 'impressions' )?.getValue?.( { item: video } )
		).toBe( 42 );
	} );
} );
