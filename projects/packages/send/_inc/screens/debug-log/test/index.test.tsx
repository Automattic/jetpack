import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { useViewportMatch } from '@wordpress/compose';
import { clearDebugLog, fetchDebugEntry, fetchDebugLog, fetchDebugText } from '../../../data/api';
import DebugEntryPanel from '../entry-panel';
import DebugLogScreen, { debugQuery } from '../index';
import type { DebugEntry, DebugLogState, SendStatus } from '../../../data/types';
import type { View } from '@wordpress/dataviews';

const mockNavigate = jest.fn();
const mockSearch = jest.fn( () => ( {} ) );
jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch(),
} ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../../../data/api', () => ( {
	fetchDebugLog: jest.fn(),
	fetchDebugText: jest.fn(),
	fetchDebugEntry: jest.fn(),
	clearDebugLog: jest.fn(),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: ( e: { message?: string } ) => e?.message ?? 'Something went wrong.',
} ) );

const entry = ( overrides: Partial< DebugEntry > = {} ): DebugEntry => ( {
	id: '5',
	created_at: '2026-10-19 14:14:03',
	level: 'error',
	area: 'sending',
	event: 'mail.failed',
	message: 'Not sent: lockdown.',
	context: { log_id: 120, reason: 'lockdown' },
	log_id: '120',
	user: '',
	...overrides,
} );

const makeStatus = ( debug: Partial< DebugLogState > = {} ) =>
	( {
		debug_log: { enabled: true, days: 7, until: '2026-10-26T14:00:00Z', entries: 0, ...debug },
	} ) as SendStatus;

const mockEntries = ( items: DebugEntry[] ) =>
	jest.mocked( fetchDebugLog ).mockResolvedValue( { items, total: items.length } );

describe( 'DebugLogScreen', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSearch.mockReturnValue( {} );
		jest
			.mocked( fetchDebugText )
			.mockResolvedValue( { text: 'Jetpack Send debug log\n…', count: 1 } );
	} );

	it.each( [
		[
			'off with nothing recorded',
			{ enabled: false },
			'The debug log is off',
			'Turn it on in Settings when you need to find a problem. It turns itself off after the time you pick.',
		],
		[
			'on with nothing recorded yet',
			{},
			'Nothing recorded yet',
			'Entries show up as your site sends email.',
		],
	] )( 'says so when it’s %s', async ( _, debug, title, description ) => {
		mockEntries( [] );
		render( <DebugLogScreen status={ makeStatus( debug ) } /> );

		await expect( screen.findByText( title ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( description ) ).toBeInTheDocument();
		// Nothing to copy or clear yet.
		expect( screen.queryByRole( 'button', { name: 'Clear…' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Copy for support' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 1440, [ 'Event', 'Level', 'Time' ] ],
		[ 1024, [ 'Event' ] ],
	] )(
		'beside an open entry at %i wide, the table shows only what fits',
		async ( width, headers ) => {
			const Width = useViewportMatch.__experimentalWidthProvider;
			mockSearch.mockReturnValue( { event: '5' } );
			mockEntries( [ entry() ] );
			render(
				<Width value={ width }>
					<DebugLogScreen status={ makeStatus( { entries: 1 } ) } />
				</Width>
			);

			await expect( screen.findByText( 'Not sent: lockdown.' ) ).resolves.toBeInTheDocument();
			const shown = screen
				.getAllByRole( 'columnheader' )
				.map( header => header.textContent?.trim() )
				.filter( text => text && [ 'Event', 'Level', 'Time' ].includes( text ) );
			expect( shown ).toEqual( headers );
		}
	);

	it( 'sends people to Settings to turn it on', async () => {
		const user = userEvent.setup();
		mockEntries( [] );
		render( <DebugLogScreen status={ makeStatus( { enabled: false } ) } /> );

		await user.click( await screen.findByRole( 'button', { name: 'Open Settings' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/settings?edit=debug' } );
	} );

	it( 'keeps the entries once it’s off, and says when they go', async () => {
		mockEntries( [ entry() ] );
		render( <DebugLogScreen status={ makeStatus( { enabled: false, entries: 1, days: 30 } ) } /> );

		await expect( screen.findByText( 'Not sent: lockdown.' ) ).resolves.toBeInTheDocument();
		expect(
			screen.getByText(
				'The debug log is off, so nothing new is recorded. These entries are deleted 1 month after they were recorded.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Turn it on' } ) ).toBeInTheDocument();
	} );

	it( 'shows an entry’s level, area and email, and opens it in the panel', async () => {
		const user = userEvent.setup();
		mockEntries( [ entry() ] );
		render( <DebugLogScreen status={ makeStatus( { entries: 1 } ) } /> );

		// eslint-disable-next-line testing-library/no-node-access -- The row's cells are what's under test.
		const row = ( await screen.findByText( 'Not sent: lockdown.' ) ).closest( 'tr' ) as HTMLElement;
		expect( within( row ).getByText( 'Error' ) ).toBeInTheDocument();
		expect( within( row ).getByText( 'Sending' ) ).toBeInTheDocument();
		expect( within( row ).getByRole( 'link', { name: 'Open email' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'p=%2Flog%3Fentry%3D120' )
		);
		await user.click( screen.getByRole( 'button', { name: 'Not sent: lockdown.' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { search: expect.any( Function ) } );
		const { search } = mockNavigate.mock.calls[ 0 ][ 0 ];
		expect( search( {} ) ).toEqual( { event: 5 } );
	} );

	it( 'shows one email’s entries behind a locked filter, and no email filter otherwise', async () => {
		mockEntries( [ entry() ] );
		mockSearch.mockReturnValue( { email: 120 } );
		const { unmount } = render( <DebugLogScreen status={ makeStatus( { entries: 1 } ) } /> );

		await waitFor( () =>
			expect( fetchDebugLog ).toHaveBeenLastCalledWith(
				expect.objectContaining( { email: '120' } )
			)
		);
		await expect( screen.findByText( 'This email' ) ).resolves.toBeInTheDocument();
		unmount();

		jest.mocked( fetchDebugLog ).mockClear();
		mockSearch.mockReturnValue( {} );
		render( <DebugLogScreen status={ makeStatus( { entries: 1 } ) } /> );
		await waitFor( () => expect( fetchDebugLog ).toHaveBeenCalled() );
		expect( jest.mocked( fetchDebugLog ).mock.calls[ 0 ][ 0 ] ).not.toHaveProperty( 'email' );
		expect( screen.queryByText( 'This email' ) ).not.toBeInTheDocument();
	} );

	it( 'copies text fetched ahead of the click, with no request inside it', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue( undefined );
		Object.defineProperty( navigator, 'clipboard', { value: { writeText }, configurable: true } );
		jest
			.mocked( fetchDebugText )
			.mockResolvedValue( { text: 'Jetpack Send debug log\n3 entries', count: 3 } );
		mockEntries( [ entry() ] );
		render( <DebugLogScreen status={ makeStatus( { entries: 3 } ) } /> );

		const button = screen.getByRole( 'button', { name: 'Copy for support' } );
		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'false' ) );
		const fetched = jest.mocked( fetchDebugText ).mock.calls.length;
		await user.click( button );

		expect( writeText ).toHaveBeenCalledWith( 'Jetpack Send debug log\n3 entries' );
		expect( fetchDebugText ).toHaveBeenCalledTimes( fetched );
		await waitFor( () => expect( speak ).toHaveBeenCalledWith( 'Copied 3 entries.' ) );
	} );

	it( 'asks before clearing every entry, then loads the empty log', async () => {
		const user = userEvent.setup();
		jest.mocked( clearDebugLog ).mockResolvedValue( { deleted: 1 } );
		mockEntries( [ entry() ] );
		render( <DebugLogScreen status={ makeStatus( { entries: 1 } ) } /> );
		await expect( screen.findByText( 'Not sent: lockdown.' ) ).resolves.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Clear…' } ) );
		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toHaveTextContent(
			'Clear all 1 entry?'
		);
		expect( clearDebugLog ).not.toHaveBeenCalled();
		mockEntries( [] );
		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );

		await expect( screen.findByText( 'Nothing recorded yet' ) ).resolves.toBeInTheDocument();
		expect( clearDebugLog ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'Cleared 1 entry.' );
	} );

	it( 'puts focus in the search box after Reset filters, since the button leaves with the empty state', async () => {
		const user = userEvent.setup();
		mockEntries( [] );
		render( <DebugLogScreen status={ makeStatus( { entries: 3 } ) } /> );
		const search = screen.getByRole( 'searchbox', { name: 'Search entries' } );

		await user.type( search, 'nothing like this' );
		await user.click( await screen.findByRole( 'button', { name: 'Reset filters' } ) );

		await waitFor( () =>
			expect( fetchDebugLog ).toHaveBeenLastCalledWith(
				debugQuery(
					{
						type: 'table',
						page: 1,
						perPage: 50,
						search: '',
						filters: [],
					},
					''
				)
			)
		);
		await waitFor( () => expect( search ).toHaveFocus() );
	} );

	it.each( [
		[ 'while it records', { entries: 30 } ],
		[ 'while it’s off', { enabled: false, entries: 30 } ],
	] )(
		'says it didn’t load %s, claims nothing and offers nothing to copy or clear, then loads it on Try again',
		async ( _, debug ) => {
			const user = userEvent.setup();
			jest.mocked( fetchDebugLog ).mockRejectedValue( new Error( 'The server is down.' ) );
			render( <DebugLogScreen status={ makeStatus( debug ) } /> );

			await expect( screen.findByText( 'The debug log didn’t load' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( 'The server is down.' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Nothing recorded yet' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( /These entries are deleted/ ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Copy for support' } )
			).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Clear…' } ) ).not.toBeInTheDocument();
			expect( speak ).toHaveBeenCalledWith(
				'The debug log didn’t load. The server is down.',
				'assertive'
			);

			mockEntries( [ entry() ] );
			await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );

			await expect( screen.findByText( 'Not sent: lockdown.' ) ).resolves.toBeInTheDocument();
			expect( fetchDebugLog ).toHaveBeenCalledTimes( 2 );
			expect( screen.queryByText( 'The debug log didn’t load' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Copy for support' } ) ).toBeInTheDocument();
			await waitFor( () =>
				expect( screen.getByRole( 'searchbox', { name: 'Search entries' } ) ).toHaveFocus()
			);
		}
	);

	it( 'says so when the text to copy didn’t load, instead of spinning, and fetches it again', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue( undefined );
		Object.defineProperty( navigator, 'clipboard', { value: { writeText }, configurable: true } );
		jest.mocked( fetchDebugText ).mockRejectedValue( new Error( 'The server is down.' ) );
		mockEntries( [ entry() ] );
		render( <DebugLogScreen status={ makeStatus( { entries: 1 } ) } /> );

		const button = screen.getByRole( 'button', { name: 'Copy for support' } );
		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'false' ) );
		const fetched = jest.mocked( fetchDebugText ).mock.calls.length;
		await user.click( button );

		expect( writeText ).not.toHaveBeenCalled();
		expect( speak ).toHaveBeenCalledWith(
			'Couldn’t get the entries to copy, so nothing was copied. Try again in a moment.',
			'assertive'
		);
		await waitFor( () =>
			expect( jest.mocked( fetchDebugText ).mock.calls.length ).toBeGreaterThan( fetched )
		);
	} );
} );

describe( 'debugQuery', () => {
	it( 'asks for any of the picked levels and areas, the search once it’s long enough, and one email', () => {
		const view: View = {
			type: 'table',
			page: 2,
			perPage: 50,
			search: ' a ',
			filters: [
				{ field: 'level', operator: 'isAny', value: [ 'error', 'warning', 'bogus' ] },
				{ field: 'area', operator: 'isAny', value: [ 'domain' ] },
			],
		};

		expect( debugQuery( view, '120' ) ).toEqual( {
			page: 2,
			per_page: 50,
			search: '',
			level: [ 'error', 'warning' ],
			area: [ 'domain' ],
			email: '120',
		} );
		expect( debugQuery( { ...view, search: 'lockdown' }, '' ) ).not.toHaveProperty( 'email' );
	} );
} );

describe( 'DebugEntryPanel', () => {
	it( 'shows the entry’s facts and its details to copy, and closes on Escape', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		jest.mocked( fetchDebugEntry ).mockResolvedValue( entry() );
		render( <DebugEntryPanel id="5" onClose={ onClose } /> );

		const title = await screen.findByRole( 'heading', { name: 'Not sent: lockdown.' } );
		await waitFor( () => expect( title ).toHaveFocus() );
		expect( screen.getByText( 'mail.failed' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Automatic' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Open email' } ) ).toBeInTheDocument();
		expect( screen.getByText( /"reason": "lockdown"/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Copy details' } ) ).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		expect( onClose ).toHaveBeenCalled();
	} );
} );
