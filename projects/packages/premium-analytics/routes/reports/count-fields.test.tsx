/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getAnnualInsightsFields } from './annual-insights/config/fields';
import { getClicksFields } from './clicks/config/fields';
import { getCommentFollowersFields } from './comment-followers/config/fields';
import { getCommentsFields } from './comments/config/fields';
import { getDownloadsFields } from './downloads/config/fields';
import { getEmailsFields } from './emails/config/fields';
import { getLocationFields } from './locations/config/fields';
import { getArchivesFields, getPostsFields } from './posts/config/fields';
import { getReferrerFields } from './referrers/config/fields';
import { getSearchTermsFields } from './search-terms/config/fields';
import { getTagsFields } from './tags/config/fields';
import { getUtmFields } from './utm/config/fields';
import { getVideosFields } from './videos/config/fields';
import type { Field } from '@jetpack-premium-analytics/externals';

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
		renderCountField( getCommentsFields(), 'comments', { value: 12345 } as never );
		renderCountField( getTagsFields(), 'views', { value: 12345 } as never );
		renderCountField( getReferrerFields(), 'views', { views: 12345 } as never );
		renderCountField( getSearchTermsFields(), 'views', { views: 12345 } as never );
		renderCountField( getUtmFields( 'source-medium' ), 'views', { views: 12345 } as never );
		renderCountField( getEmailsFields(), 'opens', { opens: 12345 } as never );
		renderCountField( getLocationFields(), 'views', { views: 12345 } as never );
		renderCountField( getAnnualInsightsFields(), 'total_posts', {
			total_posts: 12345,
		} as never );

		expect( screen.getAllByText( '12,345' ) ).toHaveLength( 15 );
	} );

	it( 'formats Emails rates with the shared formatter', () => {
		jest.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation( () => {
			throw new Error( 'Browser-locale formatting should not be used' );
		} );

		// The summary endpoint reports rates as 0–100, not 0–1.
		renderCountField( getEmailsFields(), 'opens_rate', {
			opens_rate: 66.666,
			opens: 100,
			unique_opens: 66,
		} as never );

		// Rounded to two decimals, unsigned — not `+66.67%`.
		expect( screen.getByText( '66.67%' ) ).toBeInTheDocument();
	} );

	it( 'renders an em dash for a rate that is not attributable', () => {
		renderCountField( getEmailsFields(), 'opens_rate', {
			opens_rate: 0,
			opens: 5,
			unique_opens: 0,
		} as never );

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
	} );

	it( 'formats Annual insights averages with the shared formatter', () => {
		jest.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation( () => {
			throw new Error( 'Browser-locale formatting should not be used' );
		} );

		// Legacy keeps a trailing `.0` on whole-number averages.
		renderCountField( getAnnualInsightsFields(), 'avg_comments', { avg_comments: 4 } as never );

		expect( screen.getByText( '4.0' ) ).toBeInTheDocument();
	} );
} );
