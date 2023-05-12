import { render, screen, waitFor } from '@testing-library/react';
import apiFetchMock from '@wordpress/api-fetch';
import { AuthorRecommendationEdit } from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

jest.mock( '@wordpress/api-fetch' );

const mockResponse = [
	{
		blog_id: '1',
		URL: 'https:///test.com',
		name: 'test1',
		site_icon: 'https://en.wordpress.com/i/void.gif',
	},
	{
		blog_id: '2',
		URL: 'https:///test2.com',
		name: 'test2',
		site_icon: 'https://en.wordpress.com/i/void.gif',
	},
];
describe( 'AuthorRecommendationEdit Edit', () => {
	const defaultAttributes = {
		recommendations: [],
	};
	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	test( 'Displays empty subscriptions', async () => {
		apiFetchMock.mockResolvedValueOnce( [] );

		render( <AuthorRecommendationEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect(
				screen.getByText( 'No subscriptions to display', { exact: false } )
			).toBeInTheDocument();
		} );
	} );

	test( 'Displays users subscriptions', async () => {
		apiFetchMock.mockResolvedValueOnce( mockResponse );

		render( <AuthorRecommendationEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect( screen.getAllByRole( 'img' ) ).toHaveLength( 2 );
		} );

		expect( screen.getByText( 'test1', { exact: false } ) ).toBeInTheDocument();
		expect( screen.getByText( 'test2', { exact: false } ) ).toBeInTheDocument();
	} );
} );
