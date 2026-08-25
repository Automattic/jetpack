import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRenamedTextFile, makeVideoFile } from '../../../src/dashboard/test-utils/video-file';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { Action, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
	useSearch: () => ( {} ),
	useLinkProps: ( { to }: { to: string } ) => ( { href: to } ),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// The grid itself is not under test; capture the props the stage feeds it so
// the delete callback and the spliced rows can be inspected directly.
type CapturedProps = { data: LibraryItem[]; actions: Action< LibraryItem >[] };
let mockDataViewsProps: CapturedProps | null = null;
jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	...jest.requireActual( '@wordpress/dataviews' ),
	DataViews: ( props: CapturedProps ) => {
		mockDataViewsProps = props;
		return <div data-testid="dataviews" />;
	},
} ) );

// Renders the actions slot too, so the header's upload button is reachable.
jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: ReactNode; actions?: ReactNode } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => <div data-testid="caption-manager-modal" />,
} ) );

// The onboarding flow has a suite of its own; here only the hand-over between
// it and the listing is under test. The stub's button stands in for the flow's
// own exit (a multi-file batch handing the surface back).
jest.mock( '../../../src/dashboard/components/upload-onboarding', () => ( {
	__esModule: true,
	UPLOAD_CONTEXT: 'upload-onboarding',
	default: ( { onExitToLibrary }: { onExitToLibrary: () => void } ) => (
		<button type="button" data-testid="upload-onboarding" onClick={ onExitToLibrary }>
			{ 'onboarding' }
		</button>
	),
} ) );

let mockLibraryTotal = 3;
let mockItems: LibraryItem[] = [];
jest.mock( '../../../src/dashboard/hooks/use-library', () => ( {
	LIBRARY_QUERY_KEY: 'videopress-library',
	useLibrary: () => ( {
		items: mockItems,
		isLoading: false,
		isError: false,
		error: null,
		paginationInfo: { totalItems: mockLibraryTotal, totalPages: 1 },
		refetch: jest.fn(),
	} ),
} ) );

let mockQueue: Array< Record< string, unknown > > = [];
const mockStartUpload = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: ( ...args: unknown[] ) => mockStartUpload( ...args ),
		retryUpload: jest.fn(),
		cancelUpload: jest.fn(),
		acknowledgeUpload: jest.fn(),
	} ),
} ) );

const mockDeleteVideo = jest.fn( () => Promise.resolve() );
jest.mock( '../../../src/dashboard/hooks/use-delete-video', () => ( {
	...jest.requireActual( '../../../src/dashboard/hooks/use-delete-video' ),
	useDeleteVideo: () => ( { mutateAsync: mockDeleteVideo } ),
} ) );
let mockPlanSettled = true;
// The unlimited paid plan: no cap, so every refusal gate below is off. Tests
// that need a gate replace this wholesale.
const defaultFreeTier = {
	isAtLimit: false,
	isFree: false,
	isUnlimited: true,
	videoCount: 3,
	limit: 1,
};
let mockFreeTier = defaultFreeTier;
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => ( { ...mockFreeTier, isSettled: mockPlanSettled } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-set-privacy', () => ( {
	useSetPrivacy: () => ( { mutateAsync: jest.fn() } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-upload-from-library', () => ( {
	useUploadFromLibrary: () => ( { mutateAsync: jest.fn() } ),
} ) );
const mockRunUpgrade = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => mockRunUpgrade,
} ) );
jest.mock( '../../../src/dashboard/hooks/use-persisted-view', () => ( {
	usePersistedView: ( fallback: View ) => [ fallback, jest.fn() ],
} ) );
const mockCreateErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: ( ...args: unknown[] ) => mockCreateErrorNotice( ...args ),
		createInfoNotice: jest.fn(),
	} ),
} ) );

/**
 * The stage's hidden header file picker.
 *
 * @param container - The rendered stage's container.
 * @return The picker input.
 */
function filePicker( container: HTMLElement ) {
	return container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
}

/**
 * Push files at `handleFilesSelected` through the header picker.
 *
 * The file list is assigned directly rather than through `userEvent.upload`,
 * which honours both `accept` and `multiple` — so it would refuse a `.webm`
 * outright and deliver only the first file of a multi-selection on the capped
 * free tier, which is exactly the arithmetic under test. This drives the
 * handler the way a DROP does, with neither attribute in the way.
 *
 * @param container - The rendered stage's container.
 * @param files     - Files to hand over.
 */
function pickFiles( container: HTMLElement, files: File[] ) {
	const input = filePicker( container );
	Object.defineProperty( input, 'files', { value: files, configurable: true } );
	// eslint-disable-next-line testing-library/prefer-user-event -- see above: userEvent.upload enforces `accept`/`multiple`, so it never reaches the handler with the selection these tests need.
	fireEvent.change( input );
}

/**
 * Mount the stage and pull out the DataViews delete action it built.
 *
 * @return The delete action.
 */
function mountAndGetDeleteAction() {
	render( <Stage /> );
	const action = mockDataViewsProps?.actions.find( item => item.id === 'delete' );
	if ( ! action || ! ( 'callback' in action ) ) {
		throw new Error( 'delete action missing' );
	}
	return action;
}

describe( 'library stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockDataViewsProps = null;
		mockItems = [];
		mockQueue = [];
		mockLibraryTotal = 3;
		mockPlanSettled = true;
		mockFreeTier = defaultFreeTier;
	} );

	describe( 'header upload button', () => {
		// `isAtLimit` is false until the plan count lands, so painting the button
		// before then published `aria-disabled=false` on a site that is at its
		// limit — a live control that then refuses the click it invited.
		it( 'is withheld until the plan count lands', () => {
			mockPlanSettled = false;

			render( <Stage /> );

			expect( screen.queryByRole( 'button', { name: 'Upload video' } ) ).not.toBeInTheDocument();
		} );

		it( 'arrives once the plan count has decided its state', () => {
			render( <Stage /> );

			expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();
		} );

		it( 'offers only the extensions the backend accepts', () => {
			// Under `accept="video/*"` the OS dialog listed `.webm` and `.mkv`,
			// which this surface then had to refuse after the user had chosen one.
			const { container } = render( <Stage /> );

			const accept = filePicker( container ).getAttribute( 'accept' ) ?? '';
			expect( accept ).not.toBe( 'video/*' );
			expect( accept.split( ',' ) ).toContain( '.mp4' );
			expect( accept.split( ',' ) ).not.toContain( '.webm' );
		} );

		it( 'names the format when a real WebM reaches this surface anyway', async () => {
			// A drop has no `accept` to lean on, so the Library has to answer a
			// genuine `.webm` truthfully too — not "Only video files can be
			// uploaded", which is what both testers were told.
			const { container } = render( <Stage /> );

			const webm = new File(
				[ new Uint8Array( [ 0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00 ] ) ],
				'holiday.webm',
				{ type: 'video/webm' }
			);

			pickFiles( container, [ webm ] );

			// `waitFor`, not a fixed number of ticks: this refusal costs two header
			// reads (see describeRefusal) plus planVideoDrop's own await, and
			// counting those is how a test becomes a flake.
			await waitFor( () =>
				expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
					'WEBM files can’t be uploaded. Convert your video to MP4 or MOV, then try again.',
					{ id: 'vp-upload-invalid-file' }
				)
			);
		} );

		it( 'does not open the picker at the free-tier limit', async () => {
			// aria-disabled keeps the button in the tab order and announced, so the
			// click still arrives — the handler is the gate. Without its early
			// return the OS dialog opens on a site that cannot accept the file the
			// user is about to choose.
			mockFreeTier = { isAtLimit: true, isFree: true, isUnlimited: false, videoCount: 1, limit: 1 };
			const { container } = render( <Stage /> );

			const clickPicker = jest.spyOn( filePicker( container ), 'click' );
			await userEvent.click( screen.getByRole( 'button', { name: 'Upload video' } ) );

			expect( clickPicker ).not.toHaveBeenCalled();
			clickPicker.mockRestore();
		} );

		it( 'opens the picker below the limit', async () => {
			mockFreeTier = {
				isAtLimit: false,
				isFree: true,
				isUnlimited: false,
				videoCount: 0,
				limit: 1,
			};
			const { container } = render( <Stage /> );

			const clickPicker = jest.spyOn( filePicker( container ), 'click' );
			await userEvent.click( screen.getByRole( 'button', { name: 'Upload video' } ) );

			expect( clickPicker ).toHaveBeenCalled();
			clickPicker.mockRestore();
		} );
	} );

	// The refused-drop gates. Each one has a matching test on the /upload
	// surface; the class of bug they pin — a refusal silently eaten, no notice,
	// no state change, nothing at all for the user to read — was found and fixed
	// three times on this feature, and a regression here passes CI without them.
	describe( 'refused selections', () => {
		it( 'says a file that is not a video is not a video', async () => {
			// A `.txt` renamed `.mp4` reports `video/mp4` in Chromium, so only the
			// bytes catch it.
			const { container } = render( <Stage /> );

			pickFiles( container, [ makeRenamedTextFile( 'not-a-video.mp4' ) ] );

			await waitFor( () =>
				expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Only video files can be uploaded.', {
					id: 'vp-upload-invalid-file',
				} )
			);
			expect( mockStartUpload ).not.toHaveBeenCalled();
		} );

		it( 'says why a drop is refused at the free-tier limit instead of eating it', async () => {
			mockFreeTier = { isAtLimit: true, isFree: true, isUnlimited: false, videoCount: 1, limit: 1 };
			const { container } = render( <Stage /> );

			pickFiles( container, [ makeVideoFile( 'second.mp4' ) ] );

			await waitFor( () =>
				expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
					'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
					expect.objectContaining( {
						id: 'vp-upload-at-limit',
						actions: [ expect.objectContaining( { label: 'Upgrade' } ) ],
					} )
				)
			);
			expect( mockStartUpload ).not.toHaveBeenCalled();
		} );

		it( 'routes the at-limit notice’s Upgrade action at the upgrade flow', async () => {
			mockFreeTier = { isAtLimit: true, isFree: true, isUnlimited: false, videoCount: 1, limit: 1 };
			const { container } = render( <Stage /> );

			pickFiles( container, [ makeVideoFile( 'second.mp4' ) ] );

			await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
			const options = mockCreateErrorNotice.mock.calls[ 0 ][ 1 ] as {
				actions: Array< { onClick: () => void } >;
			};
			options.actions[ 0 ].onClick();
			expect( mockRunUpgrade ).toHaveBeenCalled();
		} );

		it( 'counts the files a partial slice left behind', async () => {
			// One slot left, three videos picked: the first uploads and the notice
			// has to account for the other two, or they vanish without explanation.
			mockFreeTier = {
				isAtLimit: false,
				isFree: true,
				isUnlimited: false,
				videoCount: 0,
				limit: 1,
			};
			const { container } = render( <Stage /> );

			pickFiles( container, [
				makeVideoFile( 'one.mp4' ),
				makeVideoFile( 'two.mp4' ),
				makeVideoFile( 'three.mp4' ),
			] );

			await waitFor( () =>
				expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
					'2 videos weren’t uploaded because they exceed your plan’s limit.'
				)
			);
			expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'says nothing when the whole selection fits', async () => {
			const { container } = render( <Stage /> );

			pickFiles( container, [ makeVideoFile( 'one.mp4' ), makeVideoFile( 'two.mp4' ) ] );

			await waitFor( () => expect( mockStartUpload ).toHaveBeenCalledTimes( 2 ) );
			expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'delete', () => {
		it( 'confirms with the batch count and does nothing when declined', async () => {
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' }, { id: '2' } ] as LibraryItem[], {} as never );
			} );

			// One prompt for the whole batch, naming the count — not one per row.
			expect( confirmSpy ).toHaveBeenCalledWith( 'Permanently delete 2 videos?' );
			expect( mockDeleteVideo ).not.toHaveBeenCalled();
			confirmSpy.mockRestore();
		} );

		it( 'uses the singular prompt for one video and deletes on approval', async () => {
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' } ] as LibraryItem[], {} as never );
			} );

			expect( confirmSpy ).toHaveBeenCalledWith( 'Permanently delete 1 video?' );
			expect( mockDeleteVideo ).toHaveBeenCalledWith( [ '1' ] );
			confirmSpy.mockRestore();
		} );

		it( 'swaps the onboarding empty state in when the batch empties the library', async () => {
			mockLibraryTotal = 2;
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' }, { id: '2' } ] as LibraryItem[], {} as never );
			} );

			// The emptied grid is not a dead end: its empty state is the upload
			// onboarding flow, in place, with no navigation.
			expect( screen.getByTestId( 'upload-onboarding' ) ).toBeInTheDocument();
			expect( mockNavigate ).not.toHaveBeenCalled();
			confirmSpy.mockRestore();
		} );

		it( 'stays on the Library while other videos remain', async () => {
			mockLibraryTotal = 9;
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' } ] as LibraryItem[], {} as never );
			} );

			expect( mockNavigate ).not.toHaveBeenCalled();
			confirmSpy.mockRestore();
		} );
	} );

	it( 'dates a spliced in-flight row by its enqueue time', () => {
		mockQueue = [
			{
				id: 'q-1',
				file: new File( [ 'x' ], 'clip.mp4', { type: 'video/mp4' } ),
				progress: 0.4,
				status: 'uploading',
				enqueuedAt: '2026-01-01T00:00:00.000Z',
			},
		];

		render( <Stage /> );

		// A date rebuilt on every render walks forward while the row is on
		// screen, and this listing sorts by it.
		expect( mockDataViewsProps?.data[ 0 ].uploadDate ).toBe( '2026-01-01T00:00:00.000Z' );
	} );

	describe( 'onboarding empty state', () => {
		it( 'renders the upload flow instead of the grid when there are no videos', () => {
			mockLibraryTotal = 0;

			render( <Stage /> );

			expect( screen.getByTestId( 'upload-onboarding' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'dataviews' ) ).not.toBeInTheDocument();
			// The flow's dropzone is the one upload affordance: no header button,
			// no page-wide DropZone racing it.
			expect( screen.queryByRole( 'button', { name: 'Upload video' } ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the listing while videos exist', () => {
			render( <Stage /> );

			expect( screen.queryByTestId( 'upload-onboarding' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		it( 'keeps the listing when the queue already holds a non-flow upload', () => {
			// A batch's in-flight rows render in the listing; the flow must not
			// cover them just because the persisted count still reads zero.
			mockLibraryTotal = 0;
			mockQueue = [
				{
					id: 'q1',
					context: 'upload-batch',
					status: 'uploading',
					progress: 0.5,
					file: new File( [], 'a.mp4' ),
					enqueuedAt: '2026-01-01T00:00:00',
				},
			];

			render( <Stage /> );

			expect( screen.queryByTestId( 'upload-onboarding' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		it( 'hands the surface back to the listing when the flow exits', async () => {
			mockLibraryTotal = 0;
			const user = userEvent.setup();

			render( <Stage /> );
			await user.click( screen.getByTestId( 'upload-onboarding' ) );

			expect( screen.queryByTestId( 'upload-onboarding' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		it( 'holds the frozen empty decision even when the count moves', () => {
			// The first upload flips the count mid-flow; an unfrozen check would
			// yank the flow out from under the user the moment it succeeds.
			mockLibraryTotal = 0;
			const { rerender } = render( <Stage /> );
			expect( screen.getByTestId( 'upload-onboarding' ) ).toBeInTheDocument();

			mockLibraryTotal = 1;
			rerender( <Stage /> );

			expect( screen.getByTestId( 'upload-onboarding' ) ).toBeInTheDocument();
		} );
	} );
} );
