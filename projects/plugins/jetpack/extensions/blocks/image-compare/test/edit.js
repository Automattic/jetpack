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
			url: 'http://test.com/1',
			alt: 'Image before alt',
		},
		imageAfter: {
			id: 2,
			url: 'http://test.com/2',
			alt: 'Image after alt',
		},
		caption: 'Default caption',
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		isSelected: true,
		className: 'custom-image-compare-class',
		clientId: '1',
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'applies correct attributes to block wrapper', () => {
		render( <ImageCompareEdit { ...defaultProps } /> );
		const wrapper = screen.getByRole( 'figure' );

		expect( wrapper.classList ).toContain( defaultProps.className );
		expect( wrapper.id ).toEqual( defaultProps.clientId );
	} )

	test( 'applies juxtapose classes when images present', () => {
		const element = renderImageCompare( defaultProps );

		expect( element.classList ).toContain( 'image-compare__comparison' );
		expect( element.classList ).toContain( 'juxtapose' );
		expect( element.classList ).not.toContain( 'image-compare__placeholder' );
	} );

	test( 'applies placeholder classes when without images', () => {
		const attributes = { ...defaultAttributes, ...emptyImages };
		const element = renderImageCompare( { ...defaultProps, attributes } );

		expect( element.classList ).not.toContain( 'image-compare__comparison' );
		expect( element.classList ).not.toContain( 'juxtapose' );
		expect( element.classList ).toContain( 'image-compare__placeholder' );
	} );

	test( 'applies fallback horizontal orientation in data-mode attribute', () => {
		const element = renderImageCompare( defaultProps );

		expect( element.getAttribute( 'data-mode' ) ).toEqual( 'horizontal' );
	} );

	test( 'applies selected orientation in data-mode attribute', () => {
		const attributes = { ...defaultAttributes, orientation: 'vertical' };
		const element = renderImageCompare( { ...defaultProps, attributes } );

		expect( element.getAttribute( 'data-mode' ) ).toEqual( 'vertical' );
	} );

	test( 'displays Placeholder without selected images', () => {
		const attributes = { ...defaultAttributes, ...emptyImages };
		render( <ImageCompareEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByText( 'Image before' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Image after' ) ).toBeInTheDocument();
	} );

	// Can't get images to render...The ImgUpload component does hence
	// previous test passing. When you output the render results via
	// screen.debug() The ImgUpload DOM elements do not show even for the
	// test that passes...
	test.skip( 'renders images with correct attributes', async () => {
		// render( <ImageCompareEdit { ...defaultProps } /> );
		// await waitFor( () => screen.getByAltText( 'Image before alt' ) );
		// expect( screen.getByAltText( 'Image before alt' ) ).toBeInTheDocument();
		// await waitFor( () => screen.getByRole( 'img' ) );
		// const images = screen.getAllByRole( 'img' );
		// console.log( { images } );
		// expect( images.length ).toBe( 2 );
		// screen.debug();
		// expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		// console.log( {container} );
		// const images = screen.getByRole( 'img' );
		// const images = await screen.findByRole( 'img' );

		// const { container } = render( <ImageCompareEdit { ...defaultProps } /> );
		// const images = container.querySelectorAll( 'img' );
		// const { imageBefore, imageAfter } = defaultAttributes;

		// expect( images.length ).toBe( 2 );
		// expect( images[0].id ).toEqual( imageBefore.id );
		// expect( images[0].url ).toEqual( imageBefore.url );
		// expect( images[0].alt ).toEqual( imageBefore.alt );

		// expect( images[1].id ).toEqual( imageAfter.id );
		// expect( images[1].url ).toEqual( imageAfter.url );
		// expect( images[1].alt ).toEqual( imageAfter.alt );
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

	test.skip( 'includes resize listener', () => {

	} );

	test.skip( 'triggers juxtapose JS scan via layout effect', () => {

	} );
} );
