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
import ImgUpload from '../img-upload';

describe( 'ImgUpload', () => {
	const onChange = jest.fn();
	const defaultProps = {
		image: {
			id: 1,
			url: 'https://test.com/test.jpg',
			alt: 'Image description',
		},
		placeHolderLabel: 'Image Placeholder Label',
		onChange,
	};

	test( 'display placeholder when no image present', () => {
		render( <ImgUpload { ...{ ...defaultProps, image: {} } } /> );

		expect( screen.getByText( defaultProps.placeHolderLabel ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} )

	test( 'displays image when available', () => {
		render( <ImgUpload { ...defaultProps } /> );

		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByText( defaultProps.placeHolderLabel ) ).not.toBeInTheDocument();
	} );

	test.skip( 'calls onChange when image select changes', () => {
		// TODO
	} );
} );
