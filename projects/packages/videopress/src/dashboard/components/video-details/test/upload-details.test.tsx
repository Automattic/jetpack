import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUpload } from '../../../hooks/use-upload';
import UploadDetails from '../upload-details';
import type { UploadItem } from '../../../hooks/use-upload';
import type { ReactNode } from 'react';

jest.mock( '../../../hooks/use-upload', () => ( { useUpload: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, children }: { breadcrumbs: ReactNode; children: ReactNode } ) => (
		<div>
			{ breadcrumbs }
			{ children }
		</div>
	),
} ) );
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: { label: string }[] } ) => (
		<h1>{ items[ items.length - 1 ].label }</h1>
	),
} ) );
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	default: () => ( { hasConnectionError: false } ),
	ConnectionError: () => null,
} ) );

const updateUploadDetails = jest.fn();
const retryUpload = jest.fn();
const retryUploadDetails = jest.fn();
const createObjectURL = Object.getOwnPropertyDescriptor( URL, 'createObjectURL' );
const revokeObjectURL = Object.getOwnPropertyDescriptor( URL, 'revokeObjectURL' );
const upload: UploadItem = {
	id: 'upload-1',
	file: new File( [ 'video' ], 'draft.mp4', { type: 'video/mp4' } ),
	progress: 0,
	status: 'pending',
	details: { title: 'Draft title' },
};

beforeAll( () => {
	Object.defineProperty( URL, 'createObjectURL', {
		configurable: true,
		value: jest.fn( () => 'blob:preview' ),
	} );
	Object.defineProperty( URL, 'revokeObjectURL', { configurable: true, value: jest.fn() } );
} );

beforeEach( () => {
	jest.clearAllMocks();
	jest.mocked( useUpload ).mockReturnValue( {
		uploadQueue: [ upload ],
		completedUploads: {},
		startUpload: jest.fn(),
		updateUploadDetails,
		retryUpload,
		retryUploadDetails,
	} );
} );

afterAll( () => {
	if ( createObjectURL ) {
		Object.defineProperty( URL, 'createObjectURL', createObjectURL );
	} else {
		delete URL.createObjectURL;
	}
	if ( revokeObjectURL ) {
		Object.defineProperty( URL, 'revokeObjectURL', revokeObjectURL );
	} else {
		delete URL.revokeObjectURL;
	}
} );

it.each< { status: UploadItem[ 'status' ]; progress: number; message: string } >( [
	{ status: 'pending', progress: 0, message: 'Waiting to upload…' },
	{ status: 'uploading', progress: 0.42, message: 'Uploading 42%' },
	{ status: 'uploading', progress: 1, message: 'Finishing upload…' },
	{ status: 'success', progress: 1, message: 'Saving video details…' },
] )( 'shows "$message" during the upload lifecycle', ( { status, progress, message } ) => {
	render( <UploadDetails upload={ { ...upload, status, progress } } /> );
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( message );
	expect( screen.getByRole( 'progressbar' ) ).toHaveValue( progress * 100 );
	expect( screen.getByLabelText( 'Title' ) ).toBeEnabled();
} );

it( 'sends title, description, and settings edits to the draft before a GUID exists', async () => {
	const user = userEvent.setup();
	render( <UploadDetails upload={ upload } /> );
	await user.clear( screen.getByLabelText( 'Title' ) );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, { title: '' } );
	await user.click( screen.getByLabelText( 'Description' ) );
	await user.paste( 'A draft description' );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, {
		description: 'A draft description',
	} );
	await user.click( screen.getByRole( 'button', { name: /Privacy & sharing/ } ) );
	await user.selectOptions( screen.getByLabelText( 'Privacy' ), 'private' );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, { privacy: 'private' } );
	await user.click( screen.getByLabelText( 'Share' ) );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, { displayEmbed: true } );
	await user.click( screen.getByLabelText( 'Allow downloads' ) );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, { allowDownloads: true } );
	await user.click( screen.getByRole( 'button', { name: /Rating/ } ) );
	await user.click( screen.getByRole( 'radio', { name: 'R' } ) );
	expect( updateUploadDetails ).toHaveBeenLastCalledWith( upload.id, { rating: 'R' } );
} );

it( 'retries the upload after a transport failure with the draft still visible', async () => {
	render( <UploadDetails upload={ { ...upload, status: 'failed' } } /> );
	expect(
		screen.getByText( 'The upload failed. Retry to continue uploading with your edits.' )
	).toBeInTheDocument();
	expect( screen.getByLabelText( 'Title' ) ).toHaveValue( 'Draft title' );
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry upload' } ) );
	expect( retryUpload ).toHaveBeenCalledWith( upload.id );
	expect( retryUploadDetails ).not.toHaveBeenCalled();
} );

it( 'retries only saving the draft when the upload succeeded but its details could not be saved', async () => {
	render(
		<UploadDetails upload={ { ...upload, status: 'success', progress: 1, detailsError: true } } />
	);
	expect(
		screen.getByText(
			'Your video uploaded, but its details couldn’t be saved. Your edits are still here.'
		)
	).toBeInTheDocument();
	expect( screen.getByLabelText( 'Title' ) ).toHaveValue( 'Draft title' );
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry saving details' } ) );
	expect( retryUploadDetails ).toHaveBeenCalledWith( upload.id );
	expect( retryUpload ).not.toHaveBeenCalled();
} );

it( 'previews the local file and releases its URL when leaving the page', () => {
	const { unmount } = render(
		<UploadDetails upload={ { ...upload, details: { title: '  ' } } } />
	);
	expect( screen.getByRole( 'heading', { name: 'Untitled' } ) ).toBeInTheDocument();
	expect( screen.getByLabelText( 'Video preview' ) ).toHaveAttribute( 'src', 'blob:preview' );
	expect( URL.createObjectURL ).toHaveBeenCalledWith( upload.file );
	unmount();
	expect( URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:preview' );
} );
