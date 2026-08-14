import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadPill from '../index';
import type { UploadItem } from '../../../hooks/use-upload';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
} ) );

let mockQueue: UploadItem[] = [];
const mockRetryUpload = jest.fn();
const mockCancelUpload = jest.fn();
const mockAcknowledgeUpload = jest.fn();
jest.mock( '../../../hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: jest.fn(),
		retryUpload: mockRetryUpload,
		cancelUpload: mockCancelUpload,
		acknowledgeUpload: mockAcknowledgeUpload,
	} ),
} ) );

let itemCounter = 0;
const makeItem = ( overrides: Partial< UploadItem > = {} ): UploadItem => {
	itemCounter += 1;
	return {
		id: `u-${ itemCounter }`,
		file: new File( [ 'x' ], `video-${ itemCounter }.mp4`, { type: 'video/mp4' } ),
		progress: 0.5,
		status: 'uploading',
		enqueuedAt: '2026-08-13T10:00:00.000Z',
		...overrides,
	};
};

/**
 * Expand the pill's per-file row list.
 */
async function expandPill() {
	await userEvent.click( screen.getByRole( 'button', { name: 'Show upload details' } ) );
}

describe( 'UploadPill', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockQueue = [];
		itemCounter = 0;
	} );

	it( 'renders nothing while the queue is empty', () => {
		const { container } = render( <UploadPill /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the combined batch label and average progress while uploading', () => {
		mockQueue = [
			makeItem( { progress: 0.4 } ),
			makeItem( { progress: 0.5 } ),
			makeItem( { progress: 0.51 } ),
		];
		render( <UploadPill /> );
		expect( screen.getByRole( 'region', { name: 'Video uploads' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Uploading 3 videos — 47%' ) ).toBeInTheDocument();
	} );

	it( 'uses the singular label for one upload', () => {
		mockQueue = [ makeItem( { progress: 0.62 } ) ];
		render( <UploadPill /> );
		expect( screen.getByText( 'Uploading 1 video — 62%' ) ).toBeInTheDocument();
	} );

	it( 'expands to per-file rows', async () => {
		mockQueue = [ makeItem(), makeItem() ];
		render( <UploadPill /> );
		expect( screen.queryByText( 'video-1.mp4' ) ).not.toBeInTheDocument();

		await expandPill();

		expect( screen.getByText( 'video-1.mp4' ) ).toBeInTheDocument();
		expect( screen.getByText( 'video-2.mp4' ) ).toBeInTheDocument();
	} );

	it( 'routes a row retry through the shared queue', async () => {
		mockQueue = [ makeItem( { status: 'failed', error: 'The connection dropped.' } ) ];
		render( <UploadPill /> );

		await expandPill();
		expect( screen.getByText( 'The connection dropped.' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( mockRetryUpload ).toHaveBeenCalledWith( 'u-1' );
	} );

	it( 'guards a row cancel behind window.confirm', async () => {
		mockQueue = [ makeItem() ];
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
		render( <UploadPill /> );

		await expandPill();
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( mockCancelUpload ).not.toHaveBeenCalled();

		confirmSpy.mockReturnValue( true );
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( mockCancelUpload ).toHaveBeenCalledWith( 'u-1' );

		confirmSpy.mockRestore();
	} );

	it( 'offers "Add details" for the first success once everything has settled', async () => {
		mockQueue = [
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 77, guid: 'g77', src: 'https://v.example/77' },
			} ),
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 78, guid: 'g78', src: 'https://v.example/78' },
			} ),
		];
		render( <UploadPill /> );

		expect( screen.getByText( '2 videos uploaded' ) ).toBeInTheDocument();
		await userEvent.click( screen.getAllByRole( 'button', { name: 'Add details' } )[ 0 ] );

		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/video/77' } );
		// The row must survive the navigation: it carries the draft and the
		// draft to the video's page, which acknowledges it once the video
		// dismiss. Acknowledging here killed both for pill-navigated arrivals.
		expect( mockAcknowledgeUpload ).not.toHaveBeenCalled();
	} );

	it( 'dismiss acknowledges settled rows but not in-flight ones', async () => {
		mockQueue = [
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 77, guid: 'g77', src: 'https://v.example/77' },
			} ),
			makeItem( { status: 'failed', error: 'boom' } ),
			makeItem( { status: 'uploading' } ),
		];
		render( <UploadPill /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss finished uploads' } ) );

		expect( mockAcknowledgeUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockAcknowledgeUpload ).toHaveBeenCalledWith( 'u-1' );
		expect( mockAcknowledgeUpload ).toHaveBeenCalledWith( 'u-2' );
	} );

	it( 'stands down while every row carries the suppressed context', () => {
		mockQueue = [
			makeItem( { context: 'upload-onboarding' } ),
			makeItem( { context: 'upload-onboarding' } ),
		];
		const { container } = render( <UploadPill suppressContext="upload-onboarding" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	// The old rule suppressed all-or-nothing, so one foreign row un-suppressed
	// the edit session's own row and the pill re-announced it on top of the
	// screen already reporting it.
	it( 'filters out only the suppressed context, keeping foreign rows', async () => {
		mockQueue = [ makeItem( { context: 'upload-onboarding' } ), makeItem() ];
		render( <UploadPill suppressContext="upload-onboarding" /> );

		expect( screen.getByText( 'Uploading 1 video — 50%' ) ).toBeInTheDocument();
		await expandPill();
		expect( screen.queryByText( 'video-1.mp4' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'video-2.mp4' ) ).toBeInTheDocument();
	} );

	it( 'filters out the row for the video whose page we are standing on', async () => {
		mockQueue = [
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 77, guid: 'g77', src: 'https://v.example/77' },
			} ),
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 78, guid: 'g78', src: 'https://v.example/78' },
			} ),
		];
		render( <UploadPill suppressMediaId={ 77 } /> );

		expect( screen.getByText( '1 video uploaded' ) ).toBeInTheDocument();
		await expandPill();
		expect( screen.queryByText( 'video-1.mp4' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'video-2.mp4' ) ).toBeInTheDocument();
	} );

	it( 'hides entirely once suppression empties the list', () => {
		mockQueue = [
			makeItem( {
				status: 'success',
				progress: 1,
				media: { id: 77, guid: 'g77', src: 'https://v.example/77' },
			} ),
		];
		const { container } = render( <UploadPill suppressMediaId="77" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'dismiss ignores suppressed rows', async () => {
		mockQueue = [
			makeItem( { context: 'upload-onboarding', status: 'failed', error: 'boom' } ),
			makeItem( { status: 'failed', error: 'boom' } ),
		];
		render( <UploadPill suppressContext="upload-onboarding" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss finished uploads' } ) );

		expect( mockAcknowledgeUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockAcknowledgeUpload ).toHaveBeenCalledWith( 'u-2' );
	} );
} );
