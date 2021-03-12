/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	RelatedPostsInspectorControls, RelatedPostsBlockControls
} from '../controls';

describe( 'RelatedPostsControls', () => {
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
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	describe( 'Inspector settings', () => {
		test( 'displays Thumbnails display toggle', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByLabelText( 'Display thumbnails' ) ).toBeInTheDocument();
		} );

		test( 'sets displayThumbnails attribute', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByLabelText( 'Display thumbnails' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { displayThumbnails: true } );
		} );

		test( 'displays Date display toggle', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByLabelText( 'Display date' ) ).toBeInTheDocument();
		} );

		test( 'sets displayDate attribute', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByLabelText( 'Display date' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { displayDate: true } );
		} );

		test( 'displays context display toggle', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByLabelText( 'Display context (category or tag)' ) ).toBeInTheDocument();
		} );

		test( 'sets displayContext attribute', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByLabelText( 'Display context (category or tag)' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { displayContext: true } );
		} );

		test( 'displays number of posts slider', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Number of posts' ) ).toBeInTheDocument();
		} );

		test( 'sets postsToShow attribute', () => {
			render( <RelatedPostsInspectorControls { ...defaultProps } /> );
			userEvent.clear( screen.getAllByLabelText( 'Number of posts' )[ 1 ] );

			expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Toolbar settings', () => {
		const props = { ...defaultProps, context: 'toolbar' };

		test( 'loads and displays layouts button in toolbar', () => {
			render( <RelatedPostsBlockControls { ...props } /> );

			expect( screen.getByLabelText( 'Grid View' ) ).toBeInTheDocument();
			expect( screen.getByLabelText( 'List View' ) ).toBeInTheDocument();
		} );

		test( 'sets the postLayout attribute', async () => {
			render( <RelatedPostsBlockControls { ...props } /> );
			userEvent.click( screen.getByLabelText( 'List View' ) );

			expect( setAttributes ).toHaveBeenCalledWith( { postLayout: 'list' } );
		} );
	} );
} );
