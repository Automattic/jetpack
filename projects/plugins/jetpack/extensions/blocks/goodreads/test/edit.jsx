import { render, screen, waitFor } from '@testing-library/react';
import GoodreadsEdit from '../edit';
import useFetchGoodreadsData from '../hooks/use-fetch-goodreads-data';

jest.mock( './../hooks/use-fetch-goodreads-data' );

describe( 'GoodreadsEdit', () => {
	const defaultAttributes = {
		bookNumber: 2,
		class: '',
		customTitle: 'My Bookshelf',
		goodreadsId: '',
		id: '',
		link: '',
		orderOption: 'd',
		shelfOption: 'read',
		showAuthor: true,
		showCover: true,
		showRating: true,
		showReview: false,
		showTags: false,
		showTitle: true,
		sortOption: 'date_added',
		style: 'default',
		userInput: '',
		widgetId: 0,
	};

	const setAttributes = jest.fn();
	const removeAllNotices = jest.fn();
	const createErrorNotice = jest.fn();
	const fetchGoodreadsData = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
		setAttributes,
		fetchGoodreadsData,
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
	} );

	test( 'renders placeholder by default', async () => {
		useFetchGoodreadsData.mockImplementation( () => {
			return {
				isFetchingData: false,
				goodreadsUserId: false,
				isError: false,
			};
		} );

		render( <GoodreadsEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect(
				screen.getByPlaceholderText( 'Enter a Goodreads profile URL to embed here…' )
			).toBeInTheDocument();
		} );
	} );

	test( 'renders spinner while embedding', async () => {
		useFetchGoodreadsData.mockImplementation( () => {
			return {
				isFetchingData: true,
				goodreadsUserId: false,
				isError: false,
			};
		} );

		const attributes = {
			...defaultAttributes,
			userInput: 'https://www.goodreads.com/user/show/1176283-matt-mullenweg',
		};
		render( <GoodreadsEdit { ...{ ...defaultProps, attributes } } /> );

		await expect( screen.findByText( 'Embedding…' ) ).resolves.toBeInTheDocument();
	} );

	test( 'renders preview when finished embedding', async () => {
		useFetchGoodreadsData.mockImplementation( () => {
			return {
				isFetchingData: false,
				goodreadsUserId: '100',
				isError: false,
			};
		} );

		const attributes = {
			...defaultAttributes,
			goodreadsId: 1176283,
			widgetId: 42,
			link: 'https://www.goodreads.com/review/custom_widget/1176283.My%20Bookshelf?num_books=2&widget_id=42',
			userInput: 'https://www.goodreads.com/user/show/1176283-matt-mullenweg',
		};
		render( <GoodreadsEdit { ...{ ...defaultProps, attributes } } /> );

		let iframe;
		await waitFor( () => ( iframe = screen.getByTitle( 'Goodreads' ) ) );

		expect( iframe ).toBeInTheDocument();
	} );

	describe( 'does not load stored widget links that are not allowed', () => {
		test.each( [
			[ 'javascript scheme', 'javascript:void(0)' ],
			[ 'data scheme', 'data:text/javascript,void(0)' ],
			[ 'non-Goodreads https host', 'https://other.example.com/review/custom_widget/1.x' ],
			[
				'longer host with the same prefix',
				'https://goodreads.com.other.example.com/review/custom_widget/1.x',
			],
			[ 'not HTTPS', 'http://www.goodreads.com/review/custom_widget/1.x' ],
		] )( 'does not render the widget for %s', async ( _label, link ) => {
			useFetchGoodreadsData.mockImplementation( () => ( {
				isFetchingData: false,
				goodreadsUserId: '100',
				isError: false,
			} ) );

			const attributes = { ...defaultAttributes, goodreadsId: 1176283, widgetId: 42, link };
			render( <GoodreadsEdit { ...{ ...defaultProps, attributes } } /> );

			await expect(
				screen.findByPlaceholderText( 'Enter a Goodreads profile URL to embed here…' )
			).resolves.toBeInTheDocument();
			expect( screen.queryByTitle( 'Goodreads' ) ).not.toBeInTheDocument();
		} );
	} );
} );
