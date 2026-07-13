import { render, screen } from '@testing-library/react';
import Edit from '../edit';

const defaultAttributes = {
	images: [],
};

const images = [
	{
		alt: 'Gallery Image 1',
		caption: 'A caption',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
	},
	{
		alt: 'Gallery Image 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
	},
];

const defaultProps = {
	attributes: defaultAttributes,
};

test( 'loads without tiled gallery structure if no images', () => {
	render( <Edit { ...defaultProps } /> );
	expect( screen.getByText( 'Tiled Gallery' ) ).toBeInTheDocument();
} );

test( 'renders images if present', () => {
	const propsWithImages = { ...defaultProps, attributes: { ...defaultAttributes, images } };
	render( <Edit { ...propsWithImages } /> );
	expect( screen.getByAltText( 'Gallery Image 1' ) ).toBeInTheDocument();
	expect( screen.getByAltText( 'Gallery Image 2' ) ).toBeInTheDocument();
} );
