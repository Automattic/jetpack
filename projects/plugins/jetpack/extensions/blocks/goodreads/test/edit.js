import { render, screen, waitFor } from '@testing-library/react';
import { GoodreadsEdit } from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
} ) );

jest.mock( '../../../shared/test-embed-url', () => ( {
	__esModule: true,
	default: jest.fn().mockImplementation( ( url, setIsResolvingUrl ) => {
		setIsResolvingUrl( true );
		return new Promise( ( resolve, reject ) => {
			if ( url === 'https://www.goodreads.com/username' ) {
				setIsResolvingUrl( false );
			}
			url === 'https://www.goodreads.com/invalid-url' ? reject() : resolve( url );
		} );
	} ),
} ) );

describe( 'GoodreadsEdit', () => {
	const defaultAttributes = {
		bookNumber: 2,
		class: '',
		customTitle: 'My Bookshelf',
		goodreadsId: '',
		id: '',
		link: '',
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
		userInput: '',
		widgetId: 0,
	};

	const setAttributes = jest.fn();
	const removeAllNotices = jest.fn();
	const createErrorNotice = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
		setAttributes,
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
	} );

	test( 'renders form by default', async () => {
		render( <GoodreadsEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect(
				screen.getByPlaceholderText( 'Enter a Goodreads profile URL to embed here…' )
			).toBeInTheDocument();
		} );
	} );

	test( 'displays a spinner while the block is embedding', async () => {
		const attributes = {
			...defaultAttributes,
			goodreadsId: '1176283',
			userInput: 'https://www.goodreads.com/user/show/1176283-matt-mullenweg',
		};
		render( <GoodreadsEdit { ...{ ...defaultProps, attributes } } /> );

		await expect( screen.findByText( 'Embedding…' ) ).resolves.toBeInTheDocument();
	} );
} );
