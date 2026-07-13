import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoodreadsBlockControls, GoodreadsInspectorControls } from '../controls';

describe( 'GoodreadsControls', () => {
	const defaultAttributes = {
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

	const setAttributes = jest.fn();
	const setDisplayPreview = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		setDisplayPreview,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	describe( 'Inspector settings', () => {
		test( 'should update ShelfOption settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			const selectElement = screen.getAllByLabelText( 'Shelf' )[ 0 ];
			await user.selectOptions( selectElement, 'Currently reading' );

			expect( setAttributes ).toHaveBeenCalledWith( { shelfOption: 'currently-reading' } );
		} );

		test( 'should update customTitle settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			const input = screen.getAllByLabelText( 'Title' )[ 0 ];
			await user.type( input, '!' );

			expect( setAttributes ).toHaveBeenCalledWith( { customTitle: 'My Bookshelf!' } );
		} );

		test( 'should update sortOption settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			const selectElement = screen.getAllByLabelText( 'Sort by' )[ 0 ];
			await user.selectOptions( selectElement, 'Cover' );

			expect( setAttributes ).toHaveBeenCalledWith( { sortOption: 'cover' } );
		} );

		test( 'should update orderOption settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			const selectElement = screen.getAllByLabelText( 'Order' )[ 0 ];
			await user.selectOptions( selectElement, 'Descending' );

			expect( setAttributes ).toHaveBeenCalledWith( { orderOption: 'd' } );
		} );

		test( 'should update bookNumber settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			const input = screen.getAllByLabelText( 'Number of books' )[ 0 ];
			await user.type( input, '0' );

			expect( setAttributes ).toHaveBeenCalledWith( { bookNumber: '50' } );
		} );

		test( 'offer display settings', () => {
			render( <GoodreadsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Show cover' ) ).toBeInTheDocument();
		} );

		test( 'should update showCover settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show cover' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showCover: false } );
		} );

		test( 'should update showAuthor settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show author' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showAuthor: false } );
		} );

		test( 'should update showTitle settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show title' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showTitle: false } );
		} );

		test( 'should update showRating settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show rating' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showRating: false } );
		} );

		test( 'should update showReview settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show review' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showReview: true } );
		} );

		test( 'should update showTags settings', async () => {
			const user = userEvent.setup();
			render( <GoodreadsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Show tags' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { showTags: true } );
		} );

		test( 'hide display settings for grid', () => {
			const attributes = { ...defaultAttributes, ...{ style: 'grid' } };
			render( <GoodreadsInspectorControls { ...{ ...defaultProps, attributes } } /> );

			expect( screen.queryByText( 'Show cover' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Toolbar settings', () => {
		const props = { ...defaultProps, context: 'toolbar' };

		test( 'loads and displays layout buttons in toolbar', () => {
			render( <GoodreadsBlockControls { ...props } /> );

			expect( screen.getByLabelText( 'Default view' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'Grid view' ) ).toBeInTheDocument();
		} );

		test( 'sets the layout attribute', async () => {
			const user = userEvent.setup();
			render( <GoodreadsBlockControls { ...props } /> );
			await user.click( screen.getByLabelText( 'Grid view' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { style: 'grid' } );
		} );
	} );
} );
