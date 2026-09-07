import { render, screen } from '@testing-library/react';
import ImgUpload from '../img-upload';

describe( 'ImgUpload', () => {
	const onChange = jest.fn();
	const image = {
		id: 1,
		url: 'https://test.com/test.jpg',
		alt: 'Image description',
	};
	const defaultProps = {
		image,
		placeHolderLabel: 'Image Placeholder Label',
		onChange,
	};

	test( 'display placeholder when no image present', () => {
		render( <ImgUpload { ...{ ...defaultProps, image: {} } } /> );

		expect( screen.getByText( defaultProps.placeHolderLabel ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	test( 'displays image when available', () => {
		render( <ImgUpload { ...defaultProps } /> );
		const element = screen.getByRole( 'img' );

		expect( screen.queryByText( defaultProps.placeHolderLabel ) ).not.toBeInTheDocument();
		expect( element ).toBeInTheDocument();
		expect( element ).toHaveAttribute( 'id', `${ image.id }` );
		expect( element ).toHaveAttribute( 'src', image.url );
		expect( element ).toHaveAttribute( 'alt', image.alt );
	} );
} );
