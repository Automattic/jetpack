import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useImportJob } from '../../../src/dashboard/hooks/use-import-job';
import { useYouTubeConnection } from '../../../src/dashboard/hooks/use-youtube-connection';
import { stage as Stage } from '../stage';
import type { ImportJob } from '../../../src/dashboard/hooks/use-import-job';
import type { YouTubeConnection } from '../../../src/dashboard/hooks/use-youtube-connection';

const mockNavigate = jest.fn();

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
	Link: ( { to, children } ) => <a href={ to }>{ children }</a>,
} ) );

// The heavy page chrome is out of scope here: AdminPage pulls in the REST
// bootstrapping and Breadcrumbs its own stylesheet pipeline. Stub both to
// structural passthroughs so the tests exercise the stage's own states.
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

// The connect card and picker have their own test suites
// (src/dashboard/components/import/test); stub them to their contract with
// the stage. The queue stays real so the stage's queued/results merging is
// asserted through what the user actually sees.
jest.mock( '../../../src/dashboard/components/import/connect-card', () => ( {
	__esModule: true,
	default: ( { connectUrl, onPollingChange } ) => (
		<div data-testid="connect-card">
			<span data-testid="connect-url">{ String( connectUrl ) }</span>
			<button onClick={ () => onPollingChange( true ) }>open-popup</button>
		</div>
	),
} ) );

jest.mock( '../../../src/dashboard/components/import/picker', () => ( {
	__esModule: true,
	default: ( { accountName, onImport } ) => (
		<div data-testid="picker">
			<span>{ accountName }</span>
			<button
				onClick={ () =>
					onImport( [
						{ externalId: 'yt-1', title: 'First video' },
						{ externalId: 'yt-2', title: 'Second video' },
					] )
				}
			>
				picker-import
			</button>
		</div>
	),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-youtube-connection', () => ( {
	__esModule: true,
	useYouTubeConnection: jest.fn(),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-import-job', () => ( {
	__esModule: true,
	useImportJob: jest.fn(),
} ) );

const mockUseConnection = useYouTubeConnection as jest.Mock;
const mockUseImportJob = useImportJob as jest.Mock;

type InitialState = { features?: { studio?: boolean } };
const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

const makeConnection = ( overrides: Partial< YouTubeConnection > = {} ): YouTubeConnection => ( {
	connected: true,
	accountName: 'My Channel',
	profileImage: '',
	connectUrl: null,
	...overrides,
} );

// Hook returns are held in mutable state so re-renders see stable object
// identities (mirroring React Query) until a test replaces them wholesale.
let connectionReturn: Record< string, unknown >;
let importJobReturn: Record< string, unknown >;

const setConnection = ( overrides: Record< string, unknown > = {} ) => {
	connectionReturn = {
		connection: makeConnection(),
		isLoading: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		disconnect: jest.fn(),
		isDisconnecting: false,
		disconnectError: null,
		...overrides,
	};
};

const setImportJob = ( overrides: Record< string, unknown > = {} ) => {
	importJobReturn = {
		startImport: jest.fn().mockResolvedValue( 'job-1' ),
		isStarting: false,
		startError: null,
		jobId: null,
		job: undefined,
		jobError: null,
		isImporting: false,
		reset: jest.fn(),
		...overrides,
	};
};

describe( 'import stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		setConnection();
		setImportJob();
		mockUseConnection.mockImplementation( () => connectionReturn );
		mockUseImportJob.mockImplementation( () => importJobReturn );
	} );

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'renders the NotFound fallback when the Studio flag is off', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: false } };

		render( <Stage /> );

		expect( screen.getByText( "We couldn't find that page." ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'picker' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a loading state while the connection query is in flight', () => {
		setConnection( { connection: undefined, isLoading: true } );

		render( <Stage /> );

		expect( screen.getByText( 'Checking your YouTube connection…' ) ).toBeInTheDocument();
	} );

	it( 'shows an error state with a retry that re-fetches the connection', async () => {
		const refetch = jest.fn();
		setConnection( { connection: undefined, isError: true, refetch } );

		render( <Stage /> );

		expect( screen.getByText( "We couldn't check your YouTube connection." ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows the connect card while disconnected and polls while its popup is open', async () => {
		setConnection( {
			connection: makeConnection( {
				connected: false,
				accountName: '',
				connectUrl: 'https://example.com/connect',
			} ),
		} );

		render( <Stage /> );

		expect( screen.getByTestId( 'connect-card' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'connect-url' ) ).toHaveTextContent(
			'https://example.com/connect'
		);
		expect( mockUseConnection ).toHaveBeenLastCalledWith( { polling: false } );

		await userEvent.click( screen.getByRole( 'button', { name: 'open-popup' } ) );
		expect( mockUseConnection ).toHaveBeenLastCalledWith( { polling: true } );
	} );

	it( 'shows the picker once connected', () => {
		render( <Stage /> );

		expect( screen.getByTestId( 'picker' ) ).toBeInTheDocument();
		expect( screen.getByText( 'My Channel' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'connect-card' ) ).not.toBeInTheDocument();
	} );

	it( 'moves to the queue on import and tracks the job through to done', async () => {
		const startImport = jest.fn().mockResolvedValue( 'job-1' );
		setImportJob( { startImport } );

		const { rerender } = render( <Stage /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'picker-import' } ) );

		expect( startImport ).toHaveBeenCalledWith( [ 'yt-1', 'yt-2' ] );
		expect( screen.queryByTestId( 'picker' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'First video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second video' ) ).toBeInTheDocument();
		expect( screen.getAllByText( 'Importing…' ) ).toHaveLength( 2 );

		// The job settles: one draft created, one failure.
		const job: ImportJob = {
			jobId: 'job-1',
			status: 'done',
			items: [
				{ externalId: 'yt-1', status: 'done', attachmentId: 101, error: null },
				{
					externalId: 'yt-2',
					status: 'failed',
					attachmentId: null,
					error: { code: 'unknown_video', message: 'This video could not be found.' },
				},
			],
		};
		setImportJob( { startImport, jobId: 'job-1', job, isImporting: false } );
		rerender( <Stage /> );

		await expect( screen.findByText( 'Imported 1 of 2 videos.' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Imported' ) ).toBeInTheDocument();
		expect( screen.getByText( 'This video could not be found.' ) ).toBeInTheDocument();

		// Per-item retry re-imports just the failed id and flips it back to
		// the queued state (the old failure is dropped optimistically).
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( startImport ).toHaveBeenLastCalledWith( [ 'yt-2' ] );

		await userEvent.click( screen.getByRole( 'button', { name: 'Back to library' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/library' } );
	} );

	it( 'marks every queued item failed when the import POST itself rejects', async () => {
		const startImport = jest.fn().mockRejectedValue( new Error( 'boom' ) );
		setImportJob( { startImport } );

		const { rerender } = render( <Stage /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'picker-import' } ) );

		setImportJob( { startImport, startError: new Error( 'Service unavailable' ) } );
		rerender( <Stage /> );

		expect( screen.getAllByText( 'Failed' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Service unavailable' ) ).toHaveLength( 2 );
		expect( screen.getAllByRole( 'button', { name: 'Retry' } ) ).toHaveLength( 2 );
	} );

	it( 'keeps the queue on screen if the connection errors mid-import', async () => {
		const { rerender } = render( <Stage /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'picker-import' } ) );

		setConnection( { connection: undefined, isError: true } );
		rerender( <Stage /> );

		expect( screen.getByText( 'First video' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( "We couldn't check your YouTube connection." )
		).not.toBeInTheDocument();
	} );
} );
