import { render, screen } from '@testing-library/react';
import { mediaUpload } from '@wordpress/editor';
import Edit, { pickRelevantMediaFiles } from '../edit';

jest.mock( '@wordpress/editor', () => ( {
	mediaUpload: jest.fn(),
} ) );

const defaultAttributes = {
	images: [],
};

const images = [
	{
		alt: 'Gallery Image 1',
		caption: 'A caption',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
		width: 1024,
		height: 768,
	},
	{
		alt: 'Gallery Image 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
		width: 800,
		height: 600,
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

describe( 'pickRelevantMediaFiles', () => {
	test( 'extracts width, height, and url from large size', () => {
		const media = {
			id: 123,
			alt: 'Test Alt',
			link: 'http://example.com/item',
			sizes: {
				large: {
					url: 'http://example.com/large.jpg',
					width: 1024,
					height: 768,
				},
				full: {
					url: 'http://example.com/full.jpg',
					width: 2048,
					height: 1536,
				},
			},
		};

		const result = pickRelevantMediaFiles( media );
		expect( result ).toEqual( {
			alt: 'Test Alt',
			id: 123,
			link: 'http://example.com/item',
			url: 'http://example.com/large.jpg',
			width: 1024,
			height: 768,
		} );
	} );

	test( 'extracts width and height from media_details fallback', () => {
		const media = {
			id: 456,
			alt_text: 'Fallback Alt',
			source_url: 'http://example.com/original.jpg',
			media_details: {
				width: 1600,
				height: 1200,
				sizes: {
					large: {
						source_url: 'http://example.com/large.jpg',
						width: 1024,
						height: 768,
					},
				},
			},
		};

		const result = pickRelevantMediaFiles( media );
		expect( result.width ).toBe( 1024 );
		expect( result.height ).toBe( 768 );
		expect( result.url ).toBe( 'http://example.com/large.jpg' );
	} );
} );
