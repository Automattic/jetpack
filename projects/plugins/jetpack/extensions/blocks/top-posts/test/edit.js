import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import TopPostsEdit from '../edit';

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-shared-extension-utils' );

const defaultAttributes = {
	displayAuthor: true,
	displayContext: true,
	displayDate: true,
	displayThumbnail: true,
	layout: 'grid',
	period: '7',
	postsToShow: 3,
	postTypes: {
		post: true,
		page: false,
	},
};

const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
};

beforeEach( () => {
	apiFetch.mockReturnValue(
		Promise.resolve( [
			{
				id: 1,
				author: 'Writer 1',
				context: [
					{
						term_id: 1,
						name: 'Category',
						slug: 'category',
						term_group: 0,
						term_taxonomy_id: 1,
						taxonomy: 'category',
						description: '',
						parent: 0,
						count: 5,
						filter: 'raw',
						cat_ID: 1,
						category_count: 5,
						category_description: '',
						cat_name: 'Category',
						category_nicename: 'category',
						category_parent: 0,
					},
				],
				href: 'https://test.com',
				date: '20 Nov 2023',
				title: 'Post Title 1',
				type: 'post',
				public: true,
				views: 30,
				video_play: false,
				thumbnail: 'https://test.com/image1.png',
			},
			{
				id: 2,
				author: 'Writer 2',
				context: [
					{
						term_id: 1,
						name: 'Uncategorized',
						slug: 'uncategorized',
						term_group: 0,
						term_taxonomy_id: 1,
						taxonomy: 'category',
						description: '',
						parent: 0,
						count: 5,
						filter: 'raw',
						cat_ID: 1,
						category_count: 5,
						category_description: '',
						cat_name: 'Uncategorized',
						category_nicename: 'uncategorized',
						category_parent: 0,
					},
				],
				href: 'https://test.com',
				date: '19 Nov 2023',
				title: 'Post Title 2',
				type: 'post',
				public: true,
				views: 30,
				video_play: false,
				thumbnail: 'https://test.com/image2.png',
			},
			{
				id: 3,
				author: 'Writer 3',
				context: [
					{
						term_id: 1,
						name: 'Uncategorized',
						slug: 'uncategorized',
						term_group: 0,
						term_taxonomy_id: 1,
						taxonomy: 'category',
						description: '',
						parent: 0,
						count: 5,
						filter: 'raw',
						cat_ID: 1,
						category_count: 5,
						category_description: '',
						cat_name: 'Uncategorized',
						category_nicename: 'uncategorized',
						category_parent: 0,
					},
				],
				href: 'https://test.com',
				date: '18 Nov 2023',
				title: 'Post Title 3',
				type: 'post',
				public: true,
				views: 30,
				video_play: false,
				thumbnail: 'https://test.com/image3.png',
			},
		] )
	);

	useModuleStatus.mockReturnValue( {
		isModuleActive: true,
		changeStatus: jest.fn(),
	} );
} );

describe( 'TopPostsEdit', () => {
	/**
	 * Renders Top Posts.
	 *
	 * @param {object} attributeOverrides - Attribute overrides.
	 */
	function renderTopPosts( attributeOverrides = {} ) {
		const attributes = { ...defaultAttributes, ...attributeOverrides };

		render( <TopPostsEdit { ...{ ...defaultProps, attributes } } /> );
	}

	test( 'renders post titles', async () => {
		renderTopPosts();

		await waitFor( () => {
			expect( screen.getByText( 'Post Title 1' ) ).toBeInTheDocument();
		} );
	} );

	test( 'renders post dates', async () => {
		renderTopPosts();

		await waitFor( () => {
			expect( screen.getByText( '20 Nov 2023' ) ).toBeInTheDocument();
		} );
	} );

	test( 'does not render date when setting is disabled', async () => {
		renderTopPosts( { displayDate: false } );

		await waitFor( () => {
			expect( screen.queryByText( '20 Nov 2023' ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'renders post authors', async () => {
		renderTopPosts();
		await waitFor( () => {
			expect( screen.getByText( 'Writer 1' ) ).toBeInTheDocument();
		} );
	} );

	test( 'does not render author when setting is disabled', async () => {
		renderTopPosts( { displayAuthor: false } );

		await waitFor( () => {
			expect( screen.queryByText( 'Writer 1' ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'renders post thumbnails', async () => {
		renderTopPosts();
		await waitFor( () => {
			expect( screen.getByAltText( 'Post Title 1' ) ).toBeInTheDocument();
		} );
	} );

	test( 'does not render thumbnails when setting is disabled', async () => {
		renderTopPosts( { displayThumbnail: false } );

		await waitFor( () => {
			expect( screen.queryByAltText( 'Post Title 1' ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'renders post category', async () => {
		renderTopPosts();

		await waitFor( () => {
			expect( screen.getByText( 'Category' ) ).toBeInTheDocument();
		} );
	} );

	test( 'does not render post category when setting is disabled', async () => {
		renderTopPosts( { displayContext: false } );

		await waitFor( () => {
			expect( screen.queryByText( 'Category' ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'does not render more posts than needed', async () => {
		renderTopPosts( { postsToShow: 1 } );
		await waitFor( () => {
			expect( screen.queryByText( 'Post Title 2' ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'renders option to activate stats when module is disabled', async () => {
		useModuleStatus.mockReturnValue( {
			isModuleActive: false,
			changeStatus: jest.fn(),
		} );

		renderTopPosts();

		await waitFor( () => {
			expect( screen.getByText( 'Activate Stats' ) ).toBeInTheDocument();
		} );
	} );
} );
