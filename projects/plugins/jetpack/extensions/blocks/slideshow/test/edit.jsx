import { act, render, screen } from '@testing-library/react';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import {
	clientId,
	getBlockAttributes,
	isSavingLocked,
	makeFiles,
	reportEachFile,
	uploadFiles,
} from '../../../shared/test/upload-files';
import { SlideshowEdit } from '../edit';

const defaultAttributes = {
	ids: [ 1, 2 ],
	sizeSlug: 'large',
	images: [],
};
const images = [
	{
		alt: 'Tree 1',
		caption: '',
		id: '1',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree1.jpeg',
	},
	{
		alt: 'Tree 2',
		caption: '',
		id: '2',
		url: 'http://localhost:4759/wp-content/uploads/2021/03/tree2.jpeg',
	},
];
const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
	className: 'wp-block-jetpack-slideshow',
	clientId: 1,
	noticeOperations: {
		createErrorNotice: jest.fn(),
	},
};

test( 'loads without slideshow structure if no images', () => {
	render( <SlideshowEdit { ...defaultProps } /> );

	expect( screen.getByText( 'Slideshow' ) ).toBeInTheDocument();
	expect( screen.queryByLabelText( 'Pause Slideshow' ) ).not.toBeInTheDocument();
} );

test( 'loads basic slideshow structure if images present', () => {
	const propsWithImages = { ...defaultProps, attributes: { ...defaultAttributes, images } };
	render( <SlideshowEdit { ...propsWithImages } /> );

	expect( screen.getByAltText( 'Tree 1' ) ).toBeInTheDocument();
	expect( screen.getByAltText( 'Tree 2' ) ).toBeInTheDocument();
	expect( screen.getByLabelText( 'Pause Slideshow' ) ).toBeInTheDocument();
	const allButtons = screen.getAllByRole( 'button' );
	expect(
		allButtons.some( button =>
			button.classList.contains( 'wp-block-jetpack-slideshow_button-prev' )
		)
	).toBe( true );
	expect(
		allButtons.some( button =>
			button.classList.contains( 'wp-block-jetpack-slideshow_button-next' )
		)
	).toBe( true );
} );

test.each( [ true, false ] )(
	'shows the upload button only to users who can upload: %s',
	canUpload => {
		dispatch( blockEditorStore ).updateSettings( {
			mediaUpload: canUpload ? () => {} : undefined,
		} );
		render(
			<SlideshowEdit
				{ ...defaultProps }
				attributes={ { ...defaultAttributes, images } }
				isSelected
			/>
		);
		expect( !! screen.queryByRole( 'button', { name: 'Upload an image' } ) ).toBe( canUpload );
	}
);

const uploadToSlideshow = files =>
	uploadFiles( {
		Edit: SlideshowEdit,
		name: 'jetpack/slideshow',
		attributes: { ids: [], images: [], sizeSlug: 'large' },
		files,
	} );

test( 'keeps every image uploaded from the placeholder when uploads report one file at a time', async () => {
	reportEachFile( await uploadToSlideshow( makeFiles( [ 'a', 'b', 'c', 'd' ] ) ) );

	expect( getBlockAttributes().ids ).toEqual( [ 10, 11, 12, 13 ] );
} );

test( 'releases the save lock when the block is removed mid-upload', async () => {
	await uploadToSlideshow( makeFiles( [ 'a', 'b' ] ) );
	expect( isSavingLocked() ).toBe( true );

	act( () => {
		dispatch( blockEditorStore ).removeBlock( clientId );
	} );
	expect( isSavingLocked() ).toBe( false );
} );
