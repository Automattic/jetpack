/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';


/**
 * Internal dependencies
 */
import { 
	RelatedPostsEdit,
	PLACHOLDER_TEXT,
} from '../edit';

const posts = [
	{
		classes: [],
		context: "In 'test one'",
		date: "February 15, 2020",
		excerpt: "This is the first post!",
		format: false,
		id: 10,
		img: {
			alt_text: "Test Photo One",
			height: 200,
			width: 350,
			src: "https://i0.wp.com/test/wp-content/uploads/2021/03/IMG_001.jpg?resize=350%2C200"
		},
		rel: "",
		title: "Test Post One",
		url_meta: {
			origin: 153,
			positon: 0
		}
	},
	{
		classes: [],
		context: "In 'test two'",
		date: "February 14, 2020",
		excerpt: "This is the second post!",
		format: false,
		id: 9,
		img: {
			alt_text: "Test Photo Two",
			height: 200,
			width: 350,
			src: "https://i0.wp.com/test/wp-content/uploads/2021/03/IMG_002.jpg?resize=350%2C200"
		},
		rel: "",
		title: "Test Post Two",
		url_meta: {
			origin: 153,
			positon: 0
		}
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
		instanceId: 2
	};

	// 👀 Tests setup.
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	function renderRelatedPosts( attributeOverrides = {} ) {
		const attributes = { ...defaultAttributes, ...attributeOverrides };
		const { relatedPosts } = render( <RelatedPostsEdit { ...{ ...defaultProps, attributes } } /> );
		return relatedPosts;
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
			expect( screen.getByText( PLACHOLDER_TEXT ) ).toBeInTheDocument();
		} );
	} );

	describe( 'optional settings', () => {
		test( 'does not display date when date setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.getByText( 'February 15th, 2020' ) ).not.toBeInTheDocument();
		} );

		test( 'displays post date when date setting is enabled', () => {
			renderRelatedPosts( { displayDate: true } );

			expect( screen.getByText( 'February 15th, 2020' ) ).toBeInTheDocument();
		} );

		test( 'does not display thumbnail when thumbnail setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.getByAltText( 'Test Photo One' ) ).not.toBeInTheDocument();
		} );

		test( 'displays post thumbnail when thumbnail setting is enabled', () => {
			renderRelatedPosts( { displayThumbnails: true } );
			const thumbnail = screen.getByAltText( 'Test Photo One' );

			expect( thumbnail ).toBeInTheDocument();
		} );

		test( 'does not display context when context setting is disabled', () => {
			renderRelatedPosts();

			expect( screen.getByText( "In 'test'" ) ).not.toBeInTheDocument();
		} );

		test( 'displays post context when context setting is enabled', () => {
			renderRelatedPosts( { displayContext: true } );

			expect( screen.getByText( "In 'test one'" ) ).toBeInTheDocument();
		} );
	} );
} );
