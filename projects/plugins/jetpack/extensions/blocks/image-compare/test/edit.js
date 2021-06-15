/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ImageCompareEdit from '../edit';

function renderImageCompare( props ) {
	const { container } = render( <ImageCompareEdit { ...props } /> );
	return container.querySelector( `.${ props.className } > div` );
}

describe( 'ImageCompareEdit', () => {
	const emptyImages = { imageBefore: {}, imageAfter: {} };
	const defaultAttributes = {
		orientation: undefined,
		imageBefore: {
			id: 1,
			url: 'http://test.com/1.jpg',
			alt: 'Test image one',
		},
		imageAfter: {
			id: 2,
			url: 'http://test.com/2.jpg',
			alt: 'Test image two',
		},
		caption: 'Default caption',
	};

	const defaultProps = {
		attributes: defaultAttributes,
		isSelected: true,
		className: 'custom-image-compare-class',
		clientId: '1',
	};

	test( 'applies correct attributes to block wrapper', () => {
		render( <ImageCompareEdit { ...defaultProps } /> );
		const wrapper = screen.getByRole( 'figure' );

		expect( wrapper ).toHaveClass( defaultProps.className );
		expect( wrapper ).toHaveAttribute( 'id', defaultProps.clientId );
	} )

	test( 'applies juxtapose classes when images present', () => {
		const element = renderImageCompare( defaultProps );

		expect( element ).toHaveClass( 'image-compare__comparison' );
		expect( element ).toHaveClass( 'juxtapose' );
		expect( element ).not.toHaveClass( 'image-compare__placeholder' );
	} );

	test( 'applies placeholder classes when without images', () => {
		const attributes = { ...defaultAttributes, ...emptyImages };
		const element = renderImageCompare( { ...defaultProps, attributes } );

		expect( element ).not.toHaveClass( 'image-compare__comparison' );
		expect( element ).not.toHaveClass( 'juxtapose' );
		expect( element ).toHaveClass( 'image-compare__placeholder' );
	} );

	test( 'applies fallback horizontal orientation in data-mode attribute', () => {
		const element = renderImageCompare( defaultProps );

		expect( element ).toHaveAttribute( 'data-mode', 'horizontal' );
	} );

	test( 'applies selected orientation in data-mode attribute', () => {
		const attributes = { ...defaultAttributes, orientation: 'vertical' };
		const element = renderImageCompare( { ...defaultProps, attributes } );

		expect( element ).toHaveAttribute( 'data-mode', 'vertical' );
	} );

	test( 'displays Placeholder without selected images', () => {
		const attributes = { ...defaultAttributes, ...emptyImages };
		render( <ImageCompareEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByText( 'Image before' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Image after' ) ).toBeInTheDocument();
	} );

	test( 'displays caption component when selected and images present', () => {
		const attributes = { ...defaultAttributes, caption: undefined };
		render( <ImageCompareEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByLabelText( 'Write caption' ) ).toBeInTheDocument();
	} );

	test( 'displays caption component when attribute set and block not selected', () => {
		render( <ImageCompareEdit { ...{ ...defaultProps, isSelected: false } } /> );
		const caption = screen.getByLabelText( 'Write caption' );

		expect( caption ).toBeInTheDocument();
		expect( caption ).toHaveTextContent( defaultAttributes.caption );
	} );

	test( 'caption hidden when no value set and block not selected', () => {
		const attributes = { ...defaultAttributes, caption: undefined };
		render( <ImageCompareEdit { ...{ ...defaultProps, attributes, isSelected: false } } /> );

		expect( screen.queryByLabelText( 'Write caption' ) ).not.toBeInTheDocument();
	} );
} );
