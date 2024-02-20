import { createGoodreadsEmbedLink } from '../utils';

describe( 'GoodreadsUtils', () => {
	const attributes = {
		bookNumber: 5,
		customTitle: 'My Bookshelf',
		goodreadsId: '1176283',
		id: 'gr_custom_widget_4529663',
		link: 'https://www.goodreads.com/review/custom_widget/1176283.My Bookshelf?num_books=5&order=a&shelf=read&show_author=1&show_cover=1&show_rating=1&show_review=0&show_tags=0&show_title=1&sort=date_added&widget_id=4529663',
		orderOption: 'a',
		shelfOption: 'read',
		showAuthor: true,
		showCover: true,
		showRating: true,
		showReview: false,
		showTags: false,
		showTitle: true,
		sortOption: 'date_added',
		style: 'default',
		widgetId: 4529663,
	};

	test( 'should correctly form embed link based on attributes', async () => {
		expect( createGoodreadsEmbedLink( { attributes } ) ).toBe(
			'https://www.goodreads.com/review/custom_widget/1176283.My Bookshelf?num_books=5&order=a&shelf=read&show_author=1&show_cover=1&show_rating=1&show_review=0&show_tags=0&show_title=1&sort=date_added&widget_id=4529663'
		);
	} );
} );
