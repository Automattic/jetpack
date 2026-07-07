import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVideo } from '../../../src/dashboard/hooks/use-video';
import { makeLibraryItem } from '../../../src/dashboard/test-utils/library-item';
import { stage as Stage } from '../stage';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useParams: () => ( { id: '42' } ),
	useNavigate: () => jest.fn(),
	Link: ( { to, children } ) => <a href={ to }>{ children }</a>,
} ) );

// The heavy page chrome is out of scope here: AdminPage pulls in the REST
// bootstrapping and Breadcrumbs its own stylesheet pipeline. Stub both to
// structural passthroughs so the tests exercise the stage's own wiring.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, actions, children } ) => (
		<div>
			{ breadcrumbs }
			{ actions }
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	__esModule: true,
	Breadcrumbs: ( { items } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( item => (
				<span key={ String( item.label ) }>{ item.label }</span>
			) ) }
		</nav>
	),
} ) );

jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children } ) => <>{ children }</>,
} ) );

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting restrictions.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
const mockInfoNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
		createInfoNotice: mockInfoNotice,
	} ),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-video', () => ( {
	__esModule: true,
	useVideo: jest.fn(),
} ) );
const mockUseVideo = useVideo as jest.Mock;

const mockUpdateMeta = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-update-video-meta', () => ( {
	__esModule: true,
	useUpdateVideoMeta: () => ( { mutate: mockUpdateMeta, isPending: false } ),
} ) );

// A chapters sync that never settles: the strongest form of "slow/failed" —
// if the save waited on it, the success notice below could never fire.
const mockSyncChapters = jest.fn( () => new Promise< never >( () => {} ) );
jest.mock( '../../../src/dashboard/hooks/use-update-chapters', () => ( {
	__esModule: true,
	useUpdateChapters: () => ( { syncChapters: mockSyncChapters } ),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-delete-video', () => ( {
	__esModule: true,
	useDeleteVideo: () => ( { mutateAsync: jest.fn(), isPending: false } ),
} ) );

// Editable stand-ins for the form cards: the real ones are covered by their
// own tests; here they only need to drive useVideoDetailsForm's update().
jest.mock( '../../../src/dashboard/components/video-details/video-details-card', () => ( {
	__esModule: true,
	default: ( {
		title,
		description,
		onChange,
	}: {
		title: string;
		description: string;
		onChange: ( patch: Record< string, string > ) => void;
	} ) => (
		<div>
			<input
				aria-label="Title"
				value={ title }
				onChange={ event => onChange( { title: event.target.value } ) }
			/>
			<textarea
				aria-label="Description"
				value={ description }
				onChange={ event => onChange( { description: event.target.value } ) }
			/>
		</div>
	),
} ) );

jest.mock( '../../../src/dashboard/components/video-details/header-actions', () => ( {
	__esModule: true,
	default: ( { canSave, onSave }: { canSave: boolean; onSave: () => void } ) => (
		<button disabled={ ! canSave } onClick={ onSave }>
			Save
		</button>
	),
} ) );

jest.mock( '../../../src/dashboard/components/video-details/thumbnail-card', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../../../src/dashboard/components/video-details/privacy-sharing-card', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../../../src/dashboard/components/video-details/rating-card', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../../../src/dashboard/components/video-details/chapters-help-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../../../src/dashboard/components/video-nav', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const OLD_DESCRIPTION = 'Original description.';
const NEW_DESCRIPTION = [ '00:00 Intro', '00:30 Editing', '01:00 Export' ].join( '\n' );

describe( 'video details stage — save wiring', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseVideo.mockReturnValue( {
			video: makeLibraryItem( { description: OLD_DESCRIPTION, durationSeconds: 90 } ),
			isLoading: false,
		} );
		// Meta saves succeed synchronously so the settle path runs in-test.
		mockUpdateMeta.mockImplementation( ( _vars, callbacks ) => callbacks?.onSuccess?.() );
	} );

	it( 'fires the chapters sync alongside the meta save when the description changed', async () => {
		const user = userEvent.setup();
		render( <Stage /> );

		// paste() rather than type(): the multiline chapters block would have
		// its newlines interpreted as Enter keypresses by userEvent.type.
		await user.clear( screen.getByLabelText( 'Description' ) );
		await user.paste( NEW_DESCRIPTION );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( mockSyncChapters ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: 'abc123' } ),
			NEW_DESCRIPTION
		);
		expect( mockUpdateMeta ).toHaveBeenCalledWith(
			{ id: '42', patch: expect.objectContaining( { description: NEW_DESCRIPTION } ) },
			expect.anything()
		);
	} );

	it( 'never blocks the details save on the chapters sync', async () => {
		const user = userEvent.setup();
		render( <Stage /> );

		await user.clear( screen.getByLabelText( 'Description' ) );
		await user.paste( NEW_DESCRIPTION );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		// The mocked sync hangs forever, yet the save settled and reported
		// success — proving the sync is fired, not awaited.
		expect( mockSyncChapters ).toHaveBeenCalled();
		expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Video details saved.' );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'skips the chapters sync when the description is unchanged', async () => {
		const user = userEvent.setup();
		render( <Stage /> );

		await user.clear( screen.getByLabelText( 'Title' ) );
		await user.type( screen.getByLabelText( 'Title' ), 'A sharper title' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( mockSyncChapters ).not.toHaveBeenCalled();
		expect( mockUpdateMeta ).toHaveBeenCalledWith(
			{ id: '42', patch: expect.objectContaining( { title: 'A sharper title' } ) },
			expect.anything()
		);
	} );
} );
