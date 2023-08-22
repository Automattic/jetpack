import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogRollEdit } from '../edit';
import mockUserSubscription from '../use-subscriptions';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

jest.mock( '../use-subscriptions' );

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
describe( 'BlogRollEdit Edit', () => {
	const defaultAttributes = {
		recommendations: [],
	};
	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes: jest.fn(),
	};
	const propsWithSelected = {
		...{ ...defaultProps, isSelected: true },
	};

	const getPlaceholderButton = () => screen.getByText( 'Select recommendations', { exact: false } );

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	test( 'Displays placeholder button', async () => {
		mockUserSubscription.mockReturnValue( { subscriptions: [], isLoading: false } );

		render( <BlogRollEdit { ...defaultProps } /> );

		await waitFor( () => {
			expect( getPlaceholderButton() ).toBeInTheDocument();
		} );
	} );

	test( 'Displays users subscriptions', async () => {
		mockUserSubscription.mockReturnValue( { subscriptions: mockResponse, isLoading: false } );

		render( <BlogRollEdit { ...propsWithSelected } /> );
		await userEvent.click( getPlaceholderButton() );

		await waitFor( () => {
			expect( screen.getAllByRole( 'img' ) ).toHaveLength( 2 );
		} );

		expect( screen.getByText( 'test1', { exact: false } ) ).toBeInTheDocument();
		expect( screen.getByText( 'test2', { exact: false } ) ).toBeInTheDocument();
	} );

	test( 'Displays users subscriptions and checkboxes after placeholder button is clicked', async () => {
		mockUserSubscription.mockReturnValue( { subscriptions: mockResponse, isLoading: false } );

		render( <BlogRollEdit { ...propsWithSelected } /> );
		await userEvent.click( getPlaceholderButton() );

		await waitFor( () => {
			expect( screen.getAllByRole( 'checkbox' ) ).toHaveLength( mockResponse.length );
		} );
	} );

	test( 'Updates recommendations when checkbox is clicked', async () => {
		mockUserSubscription.mockReturnValue( { subscriptions: mockResponse, isLoading: false } );

		render( <BlogRollEdit { ...propsWithSelected } /> );
		await userEvent.click( getPlaceholderButton() );

		const firstCheckbox = await waitFor( () => screen.getAllByRole( 'checkbox' )[ 0 ] );

		await userEvent.click( firstCheckbox );
		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			recommendations: [ mockResponse[ 0 ] ],
		} );

		await userEvent.click( firstCheckbox );
		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( { recommendations: [] } );
	} );
} );
