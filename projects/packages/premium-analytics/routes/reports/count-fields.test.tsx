/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getClicksFields } from './clicks/config/fields';
import { getCommentFollowersFields } from './comment-followers/config/fields';
import { getDownloadsFields } from './downloads/config/fields';
import { getArchivesFields, getPostsFields } from './posts/config/fields';
import { getVideosFields } from './videos/config/fields';
import type { Field } from '@wordpress/dataviews';

/**
 * Render a report table's numeric field for one row.
 *
 * @param fields - Report table fields.
 * @param id     - Numeric field identifier.
 * @param item   - Report table row.
 */
function renderCountField< Item >( fields: Field< Item >[], id: string, item: Item ) {
	const field = fields.find( candidate => candidate.id === id );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Count field ${ id } is unavailable` );
	}

	render( <FieldComponent item={ item } field={ field as never } /> );
}

describe( 'report table count fields', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'uses the shared formatter while preserving full counts', () => {
		jest.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation( () => {
			throw new Error( 'Browser-locale formatting should not be used' );
		} );

		renderCountField( getPostsFields(), 'views', { views: 12345 } as never );
		renderCountField( getArchivesFields(), 'views', { views: 12345 } as never );
		renderCountField( getCommentFollowersFields(), 'subscribers', { followers: 12345 } as never );
		renderCountField( getVideosFields(), 'plays', { plays: 12345 } as never );
		renderCountField( getVideosFields(), 'impressions', { impressions: 12345 } as never );
		renderCountField( getDownloadsFields(), 'downloads', { downloads: 12345 } as never );
		renderCountField( getClicksFields(), 'clicks', { clicks: 12345 } as never );

		expect( screen.getAllByText( '12,345' ) ).toHaveLength( 7 );
	} );
} );
