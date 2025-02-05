import { render, screen } from '@testing-library/react';
import Slideshow from '../slideshow.js'; // Adjust the import path as needed

const images = [
	{
		alt: 'Tree 1',
		caption: '',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
		link: '',
		hasCustomLink: false,
	},
	{
		alt: 'Tree 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
		link: 'https://test.com',
		hasCustomLink: true,
	},
];

test( 'Wraps image in an anchor tag if hasCustomLink is true', () => {
	render( <Slideshow images={ images } /> );
	// Ensure the first image is rendered but NOT wrapped in a link
	const firstImage = screen.getByAltText( 'Tree 1' );
	expect( firstImage ).toBeInTheDocument();
	expect( screen.queryByRole( 'link', { name: /Tree 1/i } ) ).not.toBeInTheDocument();

	// Ensure the second image is wrapped inside an <a> tag with the correct href
	const link = screen.getByRole( 'link', { name: /Tree 2/i } );
	expect( link ).toHaveAttribute( 'href', 'https://test.com' );

	// Ensure the second image is inside the link
	const secondImage = screen.getByAltText( 'Tree 2' );
	expect( link ).toContainElement( secondImage );
} );
