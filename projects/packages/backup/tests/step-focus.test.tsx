// Restore and Download replace the button that was pressed, so they have to say where focus goes.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: '1786663613.9425' } ),
	Link: ( { children, to, ...rest }: { children: React.ReactNode; to: string } ) => (
		<a href={ to } { ...rest }>
			{ children }
		</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const REWIND_ID = '1786663613.9425';
const RESTORE_ID = 912682;
const DOWNLOAD_ID = 5150;

const RESTORE_RUNNING = {
	id: RESTORE_ID,
	status: 'running',
	progress: 42,
	rewind_id: REWIND_ID,
	error_code: '',
	message: '',
};
const DOWNLOAD_RUNNING = {
	id: DOWNLOAD_ID,
	status: 'running',
	progress: 63,
	url: '',
	valid_until: '',
	error: '',
};

type Answers = {
	initiate?: () => Promise< unknown >;
	status?: () => Promise< unknown >;
	restores?: unknown[];
};

/**
 * Route every request by path.
 *
 * @param answers          - What each request resolves with.
 * @param answers.initiate - The restore or download POST.
 * @param answers.status   - A restore or download status poll.
 * @param answers.restores - The restores collection.
 */
function arrange( { initiate, status, restores = [] }: Answers ) {
	mockApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( options?.method === 'POST' && initiate ) {
			return initiate();
		}
		if ( path.includes( '/status' ) && status ) {
			return status();
		}
		return Promise.resolve( restores );
	} );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'focus on the Restore and Download screens', () => {
	// The restore row passes through `queued`, whose heading unmounts while it holds focus.
	it.each( [
		[
			'Confirm restore',
			RestoreStage,
			{
				initiate: () => Promise.resolve( { id: RESTORE_ID, rewind_id: REWIND_ID } ),
				status: () => Promise.resolve( RESTORE_RUNNING ),
			},
			[ /Confirm restore/ ],
			/^Restoring from backup…$/,
		],
		[
			'Generate download',
			DownloadStage,
			{
				initiate: () => Promise.resolve( { id: DOWNLOAD_ID } ),
				status: () => Promise.resolve( DOWNLOAD_RUNNING ),
			},
			[ /Generate download/ ],
			/^Preparing download…$/,
		],
		[
			'Try again',
			DownloadStage,
			{ initiate: () => Promise.reject( new Error( 'Something went wrong.' ) ) },
			[ /Generate download/, /Try again/ ],
			/^Download backup$/,
		],
	] )(
		'moves to the next step’s heading after %s',
		async ( _name, Stage, answers: Answers, clicks, heading ) => {
			arrange( answers );
			render( <Stage /> );

			for ( const name of clicks ) {
				await userEvent.click( await screen.findByRole( 'button', { name } ) );
			}

			await waitFor( () =>
				expect( screen.getByRole( 'heading', { name: heading } ) ).toHaveFocus()
			);
		}
	);

	it( 'stays put when the screen opens on a restore already running', async () => {
		arrange( {
			status: () => Promise.resolve( RESTORE_RUNNING ),
			restores: [
				{
					restore_id: RESTORE_ID,
					rewind_id: REWIND_ID,
					when: '2026-08-20T10:00:00+00:00',
					status: 'running',
				},
			],
		} );
		render( <RestoreStage /> );

		await expect(
			screen.findByRole( 'heading', { name: /^Restoring from backup…$/ } )
		).resolves.toBeVisible();
		expect( document.body ).toHaveFocus();
	} );

	it( 'stays where the reader moved it when the restore advances', async () => {
		let answerStatus: ( value: unknown ) => void = () => {};
		arrange( {
			initiate: () => Promise.resolve( { id: RESTORE_ID, rewind_id: REWIND_ID } ),
			status: () =>
				new Promise( resolve => {
					answerStatus = resolve;
				} ),
		} );
		render( <RestoreStage /> );

		await userEvent.click( await screen.findByRole( 'button', { name: /Confirm restore/ } ) );
		await waitFor( () =>
			expect( screen.getByRole( 'heading', { name: /queued/ } ) ).toHaveFocus()
		);
		const back = screen.getByRole( 'link', { name: /Back to overview/ } );
		back.focus();
		answerStatus( RESTORE_RUNNING );

		await expect(
			screen.findByRole( 'heading', { name: /^Restoring from backup…$/ } )
		).resolves.toBeVisible();
		expect( back ).toHaveFocus();
	} );
} );
