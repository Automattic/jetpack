import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select } from '@wordpress/data';
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

const clientId = 'tiled-gallery';

/**
 * Renders the block backed by the block editor store, uploads `files`, and returns each upload call.
 *
 * @param {Array}  initialImages - The gallery's images before the upload.
 * @param {File[]} files         - The files to upload.
 * @return {Promise<Array>} The options passed to each `mediaUpload` call.
 */
async function uploadFiles( initialImages, files ) {
	const uploads = [];
	const { resetBlocks, updateBlockAttributes, updateSettings } = dispatch( blockEditorStore );
	updateSettings( { mediaUpload: options => uploads.push( options ) } );
	resetBlocks( [
		{
			clientId,
			name: 'jetpack/tiled-gallery',
			attributes: { images: initialImages },
			innerBlocks: [],
		},
	] );

	const { container } = render(
		<Edit
			{ ...defaultProps }
			attributes={ { images: initialImages } }
			clientId={ clientId }
			isSelected
			noticeOperations={ { createErrorNotice: jest.fn() } }
			setAttributes={ attrs => updateBlockAttributes( clientId, attrs ) }
		/>
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	await userEvent.setup().upload( container.querySelector( 'input[type="file"]' ), files );
	return uploads;
}

const makeFiles = ( names, FileClass = File ) =>
	names.map( name => new FileClass( [ name ], `${ name }.jpg`, { type: 'image/jpeg' } ) );

test( 'keeps every image when uploads report one file at a time', async () => {
	const [ a, b, c, d ] = await uploadFiles( images, makeFiles( [ 'a', 'b', 'c', 'd' ] ) );

	// Interleaved like the client-side queue; c and d fail the two ways uploaders report it.
	act( () => {
		a.onFileChange( [ { url: 'blob:a' } ] );
		b.onFileChange( [ { url: 'blob:b' } ] );
		c.onFileChange( [ { url: 'blob:c' } ] );
		d.onFileChange( [ { url: 'blob:d' } ] );
		b.onFileChange( [ { id: 4, url: 'http://example.com/b.jpg' } ] );
		c.onFileChange( [] );
		a.onFileChange( [ { id: 3, url: 'http://example.com/a.jpg' } ] );
		d.onError( 'Upload failed.' );
	} );

	expect( select( blockEditorStore ).getBlockAttributes( clientId ).ids ).toEqual( [ 1, 2, 3, 4 ] );
} );

test( 'uploads files picked in the editor iframe into an empty gallery', async () => {
	const iframe = document.createElement( 'iframe' );
	document.body.appendChild( iframe );

	const uploads = await uploadFiles( [], makeFiles( [ 'a', 'b' ], iframe.contentWindow.File ) );

	expect( uploads ).toHaveLength( 2 );
} );
