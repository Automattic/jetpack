import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopPostsInspectorControls, TopPostsBlockControls } from '../controls';

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-shared-extension-utils' );

describe( 'TopPostsControls', () => {
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

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		postTypesData: [
			{ label: 'Posts', id: 'post' },
			{ label: 'Pages', id: 'page' },
			{ label: 'Media', id: 'attachment' },
		],
		setAttributes,
		toggleAttributes: jest.fn(),
		setToggleAttributes: jest.fn(),
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	describe( 'Inspector settings', () => {
		test( 'displays custom content types', () => {
			render( <TopPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Display posts' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Display pages' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Display media' ) ).toBeInTheDocument();
		} );

		test( 'displays correct content types', () => {
			const overriddenProps = {
				...defaultProps,
				postTypesData: [
					{ label: 'Posts', id: 'post' },
					{ label: 'Pages', id: 'page' },
					{ label: 'Portfolios', id: 'portfolio' },
				],
			};
			render( <TopPostsInspectorControls { ...overriddenProps } /> );

			expect( screen.getByText( 'Display portfolios' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Display media' ) ).not.toBeInTheDocument();
		} );

		test( 'displays number of items slider', () => {
			render( <TopPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Number of items' ) ).toBeInTheDocument();
		} );

		test( 'sets postsToShow attribute', async () => {
			const user = userEvent.setup();
			render( <TopPostsInspectorControls { ...defaultProps } /> );
			const input = screen.getAllByLabelText( 'Number of items' )[ 1 ];
			await user.type( input, '10' );

			expect( setAttributes ).toHaveBeenCalledWith( { postsToShow: 10 } );
		} );

		test( 'sets stats period', async () => {
			const user = userEvent.setup();
			render( <TopPostsInspectorControls { ...defaultProps } /> );
			await user.selectOptions( screen.getByLabelText( 'Stats period' ), [ 'Last 48 hours' ] );

			expect( setAttributes ).toHaveBeenCalledWith( { period: '2' } );
		} );

		test( 'displays Thumbnail display toggle', () => {
			render( <TopPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByLabelText( 'Display thumbnail' ) ).toBeInTheDocument();
		} );

		test( 'sets displayThumbnail attribute', async () => {
			const user = userEvent.setup();
			render( <TopPostsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Display thumbnail' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { displayThumbnail: false } );
		} );

		test( 'displays Date display toggle', () => {
			render( <TopPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByLabelText( 'Display date' ) ).toBeInTheDocument();
		} );

		test( 'sets displayDate attribute', async () => {
			const user = userEvent.setup();
			render( <TopPostsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Display date' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { displayDate: false } );
		} );
	} );

	describe( 'Toolbar settings', () => {
		const props = { ...defaultProps, context: 'toolbar' };

		test( 'loads and displays layout buttons in toolbar', () => {
			render( <TopPostsBlockControls { ...props } /> );

			expect( screen.getByLabelText( 'Grid view' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'List view' ) ).toBeInTheDocument();
		} );

		test( 'sets the layout attribute', async () => {
			const user = userEvent.setup();
			render( <TopPostsBlockControls { ...props } /> );
			await user.click( screen.getByLabelText( 'List view' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { layout: 'list' } );
		} );
	} );
} );
