import { render, screen } from '@testing-library/react';
import { RelatedPostsEdit } from '../edit';

const posts = [
	{
		classes: [],
		context: "In 'test one'",
		date: 'February 15, 2020',
		excerpt: 'This is the first post!',
		format: false,
		id: 10,
		img: {
			alt_text: '',
			height: 200,
			width: 350,
			src: 'https://i0.wp.com/test/wp-content/uploads/2021/03/IMG_001.jpg?resize=350%2C200',
		},
		rel: '',
		title: 'Test Post One',
		url: 'http://test.com/?p=10',
		url_meta: {
			origin: 153,
			positon: 0,
		},
	},
	{
		classes: [],
		context: "In 'test two'",
		date: 'February 14, 2020',
		excerpt: 'This is the second post!',
		format: false,
		id: 9,
		img: {
			alt_text: '',
			height: 200,
			width: 350,
			src: 'https://i0.wp.com/test/wp-content/uploads/2021/03/IMG_002.jpg?resize=350%2C200',
		},
		rel: '',
		title: 'Test Post Two',
		url: 'http://test.com/?p=9',
		url_meta: {
			origin: 153,
			positon: 0,
		},
	},
];

describe( 'RelatedPostsEdit', () => {
	const defaultAttributes = {
		displayContext: false,
		displayDate: false,
		displayThumbnails: false,
		postLayout: 'grid',
		postsToShow: '2',
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
		posts: posts,
		className: 'className',
		instanceId: 2,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	/**
	 * Render related posts.
	 *
	 * @param {object} attributeOverrides - Attribute overrides.
	 */
	function renderRelatedPosts( attributeOverrides = {} ) {
		const attributes = { ...defaultAttributes, ...attributeOverrides };
		render( <RelatedPostsEdit { ...{ ...defaultProps, attributes } } /> );
	}

	describe( 'layout', () => {
		test( 'loads and displays posts in grid view', () => {
			renderRelatedPosts();

			expect( screen.getByText( 'Test Post One' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test Post Two' ) ).toBeInTheDocument();
		} );

		test( 'loads and displays posts in list view', () => {
			renderRelatedPosts( { postLayout: 'list' } );

			expect( screen.getByText( 'Test Post One' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test Post Two' ) ).toBeInTheDocument();
		} );

		test( 'limits displayed posts to the postsToShow number', () => {
			renderRelatedPosts( { postsToShow: 1 } );

			expect( screen.getByText( 'Test Post One' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Test Post Two' ) ).not.toBeInTheDocument();
		} );

		test( 'loads and displays placeholder when there are not enough related posts', () => {
			renderRelatedPosts( { postsToShow: 3 } );

			expect( screen.getByText( 'Test Post One' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test Post Two' ) ).toBeInTheDocument();
			expect(
				screen.getByText(
					"Preview unavailable: you haven't published enough posts with similar content."
				)
			).toBeInTheDocument();
		} );
	} );

	describe( 'optional settings', () => {
		test( 'does not display date when date setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.queryByText( 'February 15, 2020' ) ).not.toBeInTheDocument();
		} );

		test( 'displays post date when date setting is enabled', () => {
			renderRelatedPosts( { displayDate: true } );

			expect( screen.getByText( 'February 15, 2020' ) ).toBeInTheDocument();
		} );

		test( 'does not display thumbnail when thumbnail setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.queryByAltText( 'Test Post One' ) ).not.toBeInTheDocument();
		} );

		test( 'displays post thumbnail when thumbnail setting is enabled', () => {
			renderRelatedPosts( { displayThumbnails: true } );
			const thumbnail = screen.getByAltText( 'Test Post One' );

			expect( thumbnail ).toBeInTheDocument();
		} );

		test( 'does not display context when context setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.queryByText( "In 'test'" ) ).not.toBeInTheDocument();
		} );

		test( 'displays post context when context setting is enabled', () => {
			renderRelatedPosts( { displayContext: true } );

			expect( screen.getByText( "In 'test one'" ) ).toBeInTheDocument();
		} );

		test( 'post title links to the post', () => {
			renderRelatedPosts();

			expect( screen.getByText( 'Test Post One' ) ).toHaveAttribute(
				'href',
				'http://test.com/?p=10'
			);
		} );

		test( 'post thumbnail links to the post', () => {
			renderRelatedPosts( { displayThumbnails: true } );
			const thumbnail = screen.getByAltText( 'Test Post One' );

			// eslint-disable-next-line testing-library/no-node-access
			expect( thumbnail.closest( 'a' ) ).toHaveAttribute( 'href', 'http://test.com/?p=10' );
		} );
	} );
} );
