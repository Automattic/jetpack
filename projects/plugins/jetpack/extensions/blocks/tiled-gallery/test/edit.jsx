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

test( 'keeps every image when uploads report one file at a time', async () => {
	const user = userEvent.setup();
	const clientId = 'tiled-gallery';
	const callbacks = [];
	const { resetBlocks, updateBlockAttributes, updateSettings } = dispatch( blockEditorStore );
	updateSettings( { mediaUpload: ( { onFileChange } ) => callbacks.push( onFileChange ) } );
	resetBlocks( [
		{ clientId, name: 'jetpack/tiled-gallery', attributes: { images }, innerBlocks: [] },
	] );

	const { container } = render(
		<Edit
			{ ...defaultProps }
			attributes={ { images } }
			clientId={ clientId }
			isSelected
			setAttributes={ attrs => updateBlockAttributes( clientId, attrs ) }
		/>
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	await user.upload( container.querySelector( 'input[type="file"]' ), [
		new File( [ 'a' ], 'a.jpg', { type: 'image/jpeg' } ),
		new File( [ 'b' ], 'b.jpg', { type: 'image/jpeg' } ),
	] );

	// Interleaved like the client-side queue: both previews, then both finished uploads.
	act( () => {
		callbacks[ 0 ]( [ { url: 'blob:a' } ] );
		callbacks[ 1 ]( [ { url: 'blob:b' } ] );
		callbacks[ 1 ]( [ { id: 4, url: 'http://example.com/b.jpg' } ] );
		callbacks[ 0 ]( [ { id: 3, url: 'http://example.com/a.jpg' } ] );
	} );

	expect( select( blockEditorStore ).getBlockAttributes( clientId ).ids ).toEqual( [ 1, 2, 3, 4 ] );
} );
