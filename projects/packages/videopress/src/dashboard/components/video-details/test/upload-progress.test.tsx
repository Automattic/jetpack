import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadProgress from '../upload-progress';
import type { UploadProgressStatus } from '../upload-progress';

it.each< { status: UploadProgressStatus; progress?: number; message: string } >( [
	{ status: 'pending', message: 'Waiting to upload…' },
	{ status: 'uploading', progress: 0.42, message: 'Uploading 42%' },
	{ status: 'uploading', progress: 1, message: 'Finishing upload…' },
	{ status: 'saving', message: 'Saving video details…' },
	{ status: 'loading', message: 'Preparing video…' },
] )( 'shows "$message" in the player placeholder', ( { status, progress, message } ) => {
	render( <UploadProgress fileName="draft.mp4" status={ status } progress={ progress } /> );
	expect( screen.getByText( 'draft.mp4' ) ).toBeInTheDocument();
	expect( screen.getAllByText( message ).length ).toBeGreaterThan( 0 );
	expect(
		screen.queryByLabelText( 'Video preview', { selector: 'video' } )
	).not.toBeInTheDocument();
	expect( screen.queryByTitle( 'Video preview' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'progressbar', { name: 'Upload progress' } ) ).toBeInTheDocument();
} );

it( 'reports a percentage only while bytes are moving', () => {
	const { rerender } = render( <UploadProgress fileName="draft.mp4" status="pending" /> );
	const bar = screen.getByRole( 'progressbar', { name: 'Upload progress' } );
	expect( bar ).not.toHaveAttribute( 'aria-valuenow' );
	rerender( <UploadProgress fileName="draft.mp4" status="uploading" progress={ 0.42 } /> );
	expect( bar ).toHaveValue( 42 );
	rerender( <UploadProgress fileName="draft.mp4" status="uploading" progress={ 1 } /> );
	expect( bar ).not.toHaveAttribute( 'aria-valuenow' );
} );

it( 'announces the upload phase without announcing every percentage change', () => {
	const { rerender } = render(
		<UploadProgress fileName="draft.mp4" status="uploading" progress={ 0.25 } />
	);
	const announcement = screen.getByRole( 'status' );
	expect( announcement ).toHaveTextContent( 'Uploading…' );
	rerender( <UploadProgress fileName="draft.mp4" status="uploading" progress={ 0.5 } /> );
	expect( announcement ).toHaveTextContent( 'Uploading…' );
	expect( screen.getByText( 'Uploading 50%' ) ).toBeInTheDocument();
} );

it.each< { status: UploadProgressStatus; message: RegExp; retryLabel: string } >( [
	{ status: 'failed', message: /The upload failed/, retryLabel: 'Retry upload' },
	{ status: 'details-error', message: /couldn’t be saved/, retryLabel: 'Retry saving details' },
	{ status: 'loading-error', message: /couldn’t be loaded/, retryLabel: 'Retry loading details' },
] )(
	'offers "$retryLabel" in place of progress after a failure',
	async ( { status, message, retryLabel } ) => {
		const onRetry = jest.fn();
		render( <UploadProgress fileName="draft.mp4" status={ status } onRetry={ onRetry } /> );
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( message );
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		await userEvent.setup().click( screen.getByRole( 'button', { name: retryLabel } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	}
);
