import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDropzone from '../index';
import { selectFilesForPlan } from '../select-files';

const makeFile = ( name: string ) => new File( [ 'x' ], name, { type: 'video/mp4' } );

describe( 'UploadDropzone', () => {
	it( 'renders the single-file copy by default', () => {
		render( <UploadDropzone onFiles={ jest.fn() } /> );

		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Select a video to upload' } ) ).toBeEnabled();
	} );

	it( 'follows allowMultiple into the plural copy and a multi-file input', () => {
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } allowMultiple /> );

		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		expect( input ).toHaveAttribute( 'multiple' );
	} );

	it( 'keeps the single-file copy when copyVariant overrides a multi-file plan', () => {
		render( <UploadDropzone onFiles={ jest.fn() } allowMultiple copyVariant="single" /> );

		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
	} );

	it( 'fires onFiles with the picked files on input change', async () => {
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		const file = makeFile( 'one.mp4' );
		await userEvent.upload( input, file );

		expect( onFiles ).toHaveBeenCalledWith( [ file ] );
	} );

	it( 'fires onFiles from a drop and never while disabled', () => {
		const onFiles = jest.fn();
		const { container, rerender } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'one.mp4' ) ] } } );
		expect( onFiles ).toHaveBeenCalledTimes( 1 );

		rerender( <UploadDropzone onFiles={ onFiles } disabled /> );
		expect( dropzone ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'button', { name: 'Select a video to upload' } ) ).toBeDisabled();
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );
		expect( onFiles ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'selectFilesForPlan', () => {
	it( 'passes a multi-file plan through untouched', () => {
		const files = [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ) ];
		expect( selectFilesForPlan( files, true ) ).toEqual( { files } );
	} );

	it( 'slices the free plan to one file and names the dropped count', () => {
		const files = [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ), makeFile( 'c.mp4' ) ];
		const result = selectFilesForPlan( files, false );

		expect( result.files ).toEqual( [ files[ 0 ] ] );
		expect( result.discardedNotice ).toBe(
			'The free plan includes one video — uploading your first. Upgrade to add the other 2.'
		);
	} );

	it( 'returns an empty selection without a notice', () => {
		expect( selectFilesForPlan( [], false ) ).toEqual( { files: [] } );
	} );
} );
