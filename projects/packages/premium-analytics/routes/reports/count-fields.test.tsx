/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getAnnualInsightsFields } from './annual-insights/config/fields';
import { getAuthorsFields } from './authors/config/fields';
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
 * @return The Testing Library render result.
 */
function renderCountField( fields: Field< never >[], id: string, item: object ) {
	const field = fields.find( candidate => candidate.id === id );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Count field ${ id } is unavailable` );
	}

	return render( <FieldComponent item={ item as never } field={ field as never } /> );
}

describe( 'report table count fields', () => {
	beforeEach( () => {
		jest.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation( () => {
			throw new Error( 'Browser-locale formatting should not be used' );
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it.each( [
		[ 'Posts views', getPostsFields( false, 'posts-pages' ), 'views', { views: 12345 } ],
		[ 'Archives views', getArchivesFields(), 'views', { views: 12345 } ],
		[ 'Authors views', getAuthorsFields(), 'views', { views: 12345 } ],
		[ 'Subscribers', getCommentFollowersFields(), 'subscribers', { followers: 12345 } ],
		[ 'Videos plays', getVideosFields(), 'plays', { plays: 12345 } ],
		[ 'Videos impressions', getVideosFields(), 'impressions', { impressions: 12345 } ],
		[ 'Downloads', getDownloadsFields(), 'downloads', { downloads: 12345 } ],
		[ 'Clicks', getClicksFields(), 'clicks', { clicks: 12345 } ],
		[ 'Comments', getCommentsFields( 'authors' ), 'comments', { value: 12345 } ],
		[ 'Tags views', getTagsFields(), 'views', { value: 12345 } ],
		[ 'Referrers views', getReferrerFields(), 'views', { views: 12345 } ],
		[ 'Search terms views', getSearchTermsFields(), 'views', { views: 12345 } ],
		[ 'UTM views', getUtmFields( 'source-medium' ), 'views', { views: 12345 } ],
		[ 'Emails opens', getEmailsFields(), 'opens', { opens: 12345 } ],
		[ 'Locations views', getLocationFields(), 'views', { views: 12345 } ],
		[ 'Annual insights posts', getAnnualInsightsFields(), 'total_posts', { total_posts: 12345 } ],
	] as [ string, Field< never >[], string, object ][] )(
		'renders the %s count in full with the shared formatter',
		( _column, fields, id, item ) => {
			const { container } = renderCountField( fields, id, item );

			expect( container ).toHaveTextContent( /^12,345$/ );
		}
	);

	// Legacy keeps one decimal on averages, except words per post.
	it.each( [
		[ 'avg_comments', 4, /^4\.0$/ ],
		[ 'avg_images', 2, /^2\.0$/ ],
		[ 'avg_words', 1234.4, /^1,234$/ ],
	] )(
		'renders the Annual insights %s average to the legacy precision',
		( id, value, expected ) => {
			const { container } = renderCountField( getAnnualInsightsFields() as Field< never >[], id, {
				[ id ]: value,
			} );

			expect( container ).toHaveTextContent( expected );
		}
	);

	it.each( [
		[
			'an open rate that is not attributable',
			'opens_rate',
			{ opens_rate: 0, opens: 5, unique_opens: 0, total_sends: 100 },
		],
		[
			'an open rate on an email with no recorded sends',
			'opens_rate',
			{ opens_rate: 0, opens: 0, unique_opens: 0, total_sends: 0 },
		],
		[
			'a click rate that is not attributable',
			'clicks_rate',
			{ clicks_rate: 0, clicks: 1, unique_clicks: 0, opens: 10, unique_opens: 8, total_sends: 100 },
		],
	] )( 'renders an em dash for %s', ( _case, id, item ) => {
		const { container } = renderCountField( getEmailsFields() as Field< never >[], id, item );

		expect( container ).toHaveTextContent( /^—$/ );
	} );
} );
