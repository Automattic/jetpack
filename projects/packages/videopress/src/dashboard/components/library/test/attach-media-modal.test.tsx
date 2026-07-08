import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachImportMediaError } from '../../../hooks/use-attach-import-media';
import { makeLibraryItem } from '../../../test-utils/library-item';
import AttachMediaModal from '../attach-media-modal';
import type { UploadItem } from '../../../hooks/use-upload';

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting rules.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

// Mock only the hook; `...actual` keeps AttachImportMediaError the real class
// so the component's instanceof checks see the same constructor the test
// rejects with. The hook's own behaviour (upload settlers, metadata, poster,
// draft delete) is covered by its dedicated suite.
const mockAttach = jest.fn();
const mockReset = jest.fn();
let mockIsAttaching = false;
let mockUploadItemId: string | null = null;
jest.mock( '../../../hooks/use-attach-import-media', () => ( {
	...jest.requireActual( '../../../hooks/use-attach-import-media' ),
	useAttachImportMedia: () => ( {
		attach: mockAttach,
		isAttaching: mockIsAttaching,
		error: null,
		result: undefined,
		uploadItemId: mockUploadItemId,
		reset: mockReset,
	} ),
} ) );

// The modal only reads the shared queue for progress display.
let mockUploadQueue: UploadItem[] = [];
jest.mock( '../../../hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockUploadQueue,
		startUpload: jest.fn(),
		retryUpload: jest.fn(),
	} ),
} ) );

const makeDraft = () => makeLibraryItem( { id: '7', type: 'draft', guid: '', title: 'My import' } );

const pickFile = ( file: File ) => {
	// eslint-disable-next-line testing-library/prefer-user-event -- userEvent.upload refuses the display:none input (the visible affordance is the "Select video file" button that proxies to it).
	fireEvent.change( screen.getByLabelText( 'Video file' ), { target: { files: [ file ] } } );
};

describe( 'AttachMediaModal', () => {
	beforeEach( () => {
		mockAttach.mockReset();
		mockReset.mockClear();
		mockSuccessNotice.mockClear();
		mockErrorNotice.mockClear();
		mockIsAttaching = false;
		mockUploadItemId = null;
		mockUploadQueue = [];
	} );

	it( 'disables Attach until a file is picked, then attaches, notifies, and closes', async () => {
		mockAttach.mockResolvedValue( { mediaId: 99, guid: 'g', posterApplied: true } );
		const onClose = jest.fn();
		render( <AttachMediaModal draft={ makeDraft() } onClose={ onClose } /> );

		const attachButton = screen.getByRole( 'button', { name: 'Attach video file' } );
		// @wordpress/ui Buttons disable via aria-disabled (focusableWhenDisabled).
		expect( attachButton ).toHaveAttribute( 'aria-disabled', 'true' );

		const file = new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } );
		pickFile( file );
		expect( screen.getByText( 'export.mp4' ) ).toBeInTheDocument();
		expect( attachButton ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await userEvent.click( attachButton );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockAttach ).toHaveBeenCalledWith( { draftId: '7', file } );
		expect( mockSuccessNotice ).toHaveBeenCalledWith( '"My import" is now a VideoPress video.' );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'closes without attaching when Cancel is clicked', async () => {
		const onClose = jest.fn();
		render( <AttachMediaModal draft={ makeDraft() } onClose={ onClose } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalled();
		expect( mockAttach ).not.toHaveBeenCalled();
	} );

	it( 'keeps the dialog open with an inline error when the upload step fails', async () => {
		mockAttach.mockRejectedValue( new AttachImportMediaError( 'upload', 'tus exploded' ) );
		const onClose = jest.fn();
		render( <AttachMediaModal draft={ makeDraft() } onClose={ onClose } /> );

		pickFile( new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Attach video file' } ) );

		await expect(
			screen.findByText( 'The upload failed: tus exploded' )
		).resolves.toBeInTheDocument();
		// Nothing was created, so the dialog stays open for a retry and no
		// notice fires — the inline message is the feedback.
		expect( onClose ).not.toHaveBeenCalled();
		expect( mockErrorNotice ).not.toHaveBeenCalled();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'closes with an error notice when metadata application fails after the upload', async () => {
		mockAttach.mockRejectedValue(
			new AttachImportMediaError( 'metadata', 'meta nope', { mediaId: 9, guid: 'g' } )
		);
		const onClose = jest.fn();
		render( <AttachMediaModal draft={ makeDraft() } onClose={ onClose } /> );

		pickFile( new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Attach video file' } ) );

		// The upload succeeded — retrying would duplicate the video, so the
		// dialog closes and the notice explains what's left to do.
		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockErrorNotice ).toHaveBeenCalledWith(
			'The video was uploaded, but its imported details could not be applied. Edit the video manually, then delete the draft.'
		);
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'closes with an error notice when removing the draft fails after the upload', async () => {
		mockAttach.mockRejectedValue(
			new AttachImportMediaError( 'delete_draft', 'kept', { mediaId: 9, guid: 'g' } )
		);
		const onClose = jest.fn();
		render( <AttachMediaModal draft={ makeDraft() } onClose={ onClose } /> );

		pickFile( new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Attach video file' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockErrorNotice ).toHaveBeenCalledWith(
			'The video was uploaded, but the import draft could not be removed. You can delete it from the library.'
		);
	} );

	it( 'shows queue progress while the file is uploading and disables the footer', () => {
		mockIsAttaching = true;
		mockUploadItemId = 'upload-1';
		mockUploadQueue = [
			{
				id: 'upload-1',
				file: new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ),
				progress: 0.4,
				status: 'uploading',
			},
		];
		render( <AttachMediaModal draft={ makeDraft() } onClose={ jest.fn() } /> );

		expect( screen.getByText( 'Uploading… 40%' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Attaching…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'shows "Preparing…" before the upload starts and "Finishing up…" after it succeeds', () => {
		mockIsAttaching = true;
		// Pre-read phase: no queue item for this attempt yet.
		const { rerender } = render( <AttachMediaModal draft={ makeDraft() } onClose={ jest.fn() } /> );
		expect( screen.getByText( 'Preparing…' ) ).toBeInTheDocument();

		// Post-upload phase: the item settled but metadata/poster/draft
		// cleanup are still running.
		mockUploadItemId = 'upload-1';
		mockUploadQueue = [
			{
				id: 'upload-1',
				file: new File( [ 'x' ], 'export.mp4', { type: 'video/mp4' } ),
				progress: 1,
				status: 'success',
			},
		];
		rerender( <AttachMediaModal draft={ makeDraft() } onClose={ jest.fn() } /> );
		expect( screen.getByText( 'Finishing up…' ) ).toBeInTheDocument();

		// Same phase after the queue's 2s success prune removes the item.
		mockUploadQueue = [];
		rerender( <AttachMediaModal draft={ makeDraft() } onClose={ jest.fn() } /> );
		expect( screen.getByText( 'Finishing up…' ) ).toBeInTheDocument();
	} );
} );
