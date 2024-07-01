import { __, _x } from '@wordpress/i18n';

export const GOODREADS_DEFAULT_TITLE = __( 'My Bookshelf', 'jetpack' );

export const GOODREADS_SHELF_OPTIONS = [
	{
		label: _x( 'Read', 'perfect participle - eg. I read a book yesterday.', 'jetpack' ),
		value: 'read',
	},
	{ label: __( 'Currently reading', 'jetpack' ), value: 'currently-reading' },
	{
		label: _x( 'To read', 'future participle - eg. I have this to read tomorrow.', 'jetpack' ),
		value: 'to-read',
	},
];

export const GOODREADS_SORT_OPTIONS = [
	{ label: 'ASIN', value: 'asin' },
	{ label: _x( 'Author', 'noun', 'jetpack' ), value: 'author' },
	{ label: __( 'Average rating', 'jetpack' ), value: 'avg_rating' },
	{ label: _x( 'Comments', 'noun', 'jetpack' ), value: 'comments' },
	{ label: _x( 'Cover', 'noun - ie. book cover', 'jetpack' ), value: 'cover' },
	{ label: __( 'Date added', 'jetpack' ), value: 'date_added' },
	{ label: __( 'Date published', 'jetpack' ), value: 'date_pub' },
	{ label: __( 'Date read', 'jetpack' ), value: 'date_read' },
	{ label: __( 'Date started', 'jetpack' ), value: 'date_started' },
	{ label: __( 'Dated updated', 'jetpack' ), value: 'date_updated' },
	{ label: _x( 'Format', 'noun', 'jetpack' ), value: 'format' },
	{ label: 'ISBN', value: 'isbn' },
	{ label: 'ISBN-13', value: 'isbn13' },
	{ label: _x( 'Notes', 'noun', 'jetpack' ), value: 'notes' },
	{ label: __( 'Number of pages', 'jetpack' ), value: 'num_pages' },
	{ label: __( 'Number of ratings', 'jetpack' ), value: 'num_ratings' },
	{
		label: _x( 'Owned', 'possessive - eg. I owned this book for a year', 'jetpack' ),
		value: 'owned',
	},
	{ label: _x( 'Position', 'noun', 'jetpack' ), value: 'position' },
	{ label: __( 'Random', 'jetpack', 'jetpack' ), value: 'random' },
	{ label: _x( 'Rating', 'noun', 'jetpack' ), value: 'rating' },
	{ label: __( 'Read count', 'jetpack' ), value: 'read_count' },
	{ label: _x( 'Review', 'noun', 'jetpack' ), value: 'review' },
	{ label: _x( 'Shelves', 'noun', 'jetpack' ), value: 'shelves' },
	{ label: _x( 'Title', 'noun', 'jetpack' ), value: 'title' },
	{ label: _x( 'Votes', 'noun', 'jetpack' ), value: 'votes' },
	{ label: __( 'Year published', 'jetpack' ), value: 'year_pub' },
];

export const GOODREADS_ORDER_OPTIONS = [
	{ label: __( 'Ascending', 'jetpack' ), value: 'a' },
	{ label: __( 'Descending', 'jetpack' ), value: 'd' },
];

export function createGoodreadsEmbedLink( { attributes } ) {
	const {
		bookNumber,
		customTitle = GOODREADS_DEFAULT_TITLE,
		goodreadsId,
		orderOption,
		shelfOption,
		showAuthor,
		showCover,
		showRating,
		showReview,
		showTags,
		showTitle,
		sortOption,
		style,
		widgetId,
	} = attributes;

	if ( ! goodreadsId ) {
		return;
	}

	let link = `https://www.goodreads.com/review/custom_widget/${ goodreadsId }.${ customTitle }?num_books=${ bookNumber }&order=${ orderOption }&shelf=${ shelfOption }&show_author=${
		showAuthor ? 1 : 0
	}&show_cover=${ showCover ? 1 : 0 }&show_rating=${ showRating ? 1 : 0 }&show_review=${
		showReview ? 1 : 0
	}&show_tags=${ showTags ? 1 : 0 }&show_title=${
		showTitle ? 1 : 0
	}&sort=${ sortOption }&widget_id=${ widgetId }`;

	if ( style === 'grid' ) {
		link = `https://www.goodreads.com/review/grid_widget/${ goodreadsId }.${ customTitle }?cover_size=medium&num_books=${ bookNumber }&order=${ orderOption }&shelf=${ shelfOption }&sort=${ sortOption }&widget_id=${ widgetId }`;
	}

	return link;
}
