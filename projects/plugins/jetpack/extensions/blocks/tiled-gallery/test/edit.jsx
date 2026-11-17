import { act, render, screen } from '@testing-library/react';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import {
	clientId,
	getBlockAttributes,
	makeFiles,
	uploadFiles,
} from '../../../shared/test/upload-files';
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

test.each( [ true, false ] )(
	'shows the upload button only to users who can upload: %s',
	canUpload => {
		dispatch( blockEditorStore ).updateSettings( {
			mediaUpload: canUpload ? () => {} : undefined,
		} );
		render(
			<Edit { ...defaultProps } attributes={ { ...defaultAttributes, images } } isSelected />
		);
		expect( !! screen.queryByRole( 'button', { name: 'Upload an image' } ) ).toBe( canUpload );
	}
);

const uploadToGallery = ( initialImages, files ) =>
	uploadFiles( {
		Edit,
		name: 'jetpack/tiled-gallery',
		attributes: { images: initialImages },
		files,
	} );

test( 'keeps every image when uploads report one file at a time', async () => {
	const [ a, b, c, d ] = await uploadToGallery( images, makeFiles( [ 'a', 'b', 'c', 'd' ] ) );
	const getImages = () => getBlockAttributes().images;

	// Interleaved like the client-side queue. a sends no preview and finishes last; c and d fail
	// the two ways uploaders report it; b gets pre-rotation dimensions and a link mid-processing.
	act( () => {
		b.onFileChange( [ { url: 'blob:b' } ] );
		c.onFileChange( [ { url: 'blob:c' } ] );
		d.onFileChange( [ { url: 'blob:d' } ] );
		b.onFileChange( [ { id: 4, url: 'http://example.com/b.jpg' } ] );
		dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
			images: getImages().map( img =>
				img.id === 4
					? { ...img, width: 4032, height: 3024, customLink: 'http://example.com/b' }
					: img
			),
		} );
		b.onFileChange( [ { id: 4, url: 'http://example.com/b-scaled.jpg' } ] );
		c.onFileChange( [] );
		d.onError( 'Upload failed.' );
		a.onFileChange( [ { id: 3, url: 'http://example.com/a.jpg' } ] );
	} );

	expect( getBlockAttributes().ids ).toEqual( [ 1, 2, 3, 4 ] );
	expect( getImages()[ 3 ] ).toEqual( {
		id: 4,
		url: 'http://example.com/b-scaled.jpg',
		customLink: 'http://example.com/b',
	} );
} );

test( 'uploads files picked in the editor iframe into an empty gallery', async () => {
	const iframe = document.createElement( 'iframe' );
	document.body.appendChild( iframe );

	const uploads = await uploadToGallery( [], makeFiles( [ 'a', 'b' ], iframe.contentWindow.File ) );
	expect( uploads ).toHaveLength( 2 );

	const getColumns = () => getBlockAttributes().columns;

	// Columns follow the uploads that succeed, not the files selected.
	act( () => uploads[ 1 ].onError( 'File too large.' ) );
	expect( getColumns() ).toBeUndefined();

	act( () => uploads[ 0 ].onFileChange( [ { id: 3, url: 'http://example.com/a.jpg' } ] ) );
	expect( getColumns() ).toBe( 1 );
} );
