/* eslint-disable testing-library/no-node-access -- the open row is a data attribute inside a DataViews cell. */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { inspector as Inspector } from '../../../../routes/log/inspector';
import { deleteLogEntries, fetchLog, fetchLogEntry, getOriginOptions } from '../../../data/api';
import { SUPPORT_URL } from '../../../data/failure-reasons';
import LogScreen from '../index';
import type { LogEntry, LogPage, LogQuery, LogRow } from '../../../data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

// A stand-in for the router: one search object both surfaces read, changed by navigate.
const mockRouter = {
	search: {} as Record< string, unknown >,
	listeners: new Set< () => void >(),
};
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => {
	const { useSyncExternalStore } = jest.requireActual( 'react' );
	const subscribe = ( listener: () => void ) => {
		mockRouter.listeners.add( listener );
		return () => mockRouter.listeners.delete( listener );
	};
	return {
		useSearch: () => useSyncExternalStore( subscribe, () => mockRouter.search ),
		useNavigate: () => mockNavigate,
	};
} );
jest.mock( '../../../data/api', () => ( {
	fetchLog: jest.fn(),
	fetchLogEntry: jest.fn(),
	deleteLogEntries: jest.fn(),
	resendLogEntry: jest.fn(),
	getOriginOptions: jest.fn(),
	errorMessage: ( e: { message?: string } ) => e?.message ?? 'error',
} ) );
const mockLogChanged = jest.fn();
const mockStatus = {
	account: { domain: 'example.com' },
	onboarding: { auto_test_log_id: null as string | null },
	provisioner: 'wpcom' as 'wpcom' | 'local' | null,
	current_user_email: 'owner@example.com',
	log_retention_days: 30,
	log_retention_locked: false,
	log_covers_from: null as string | null,
	log_trimmed_before: null as string | null,
	has_history: false,
};
jest.mock( '../../../data/store', () => {
	const { createReduxStore, register, useSelect } = jest.requireActual( '@wordpress/data' );
	const sendStore = createReduxStore( 'jetpack-send-log-test', {
		reducer: (
			state = { rows: {}, deleteRequest: null, logVersion: 0 },
			action: { type: string; rows?: { id: string }[]; row?: unknown }
		) => {
			if ( action.type === 'RECEIVE_LOG_ROWS' ) {
				const rows = { ...state.rows };
				action.rows?.forEach( item => ( rows[ item.id ] = item ) );
				return { ...state, rows };
			}
			if ( action.type === 'LOG_DELETE_REQUEST' ) {
				return { ...state, deleteRequest: action.row };
			}
			if ( action.type === 'LOG_CHANGED' ) {
				return { ...state, logVersion: state.logVersion + 1 };
			}
			return state;
		},
		actions: {
			logChanged: () => {
				mockLogChanged();
				return { type: 'LOG_CHANGED' };
			},
			receiveLogRows: ( rows: unknown[] ) => ( { type: 'RECEIVE_LOG_ROWS', rows } ),
			requestLogDelete: ( row: unknown ) => ( { type: 'LOG_DELETE_REQUEST', row } ),
		},
		selectors: {
			getLogRow: ( state: { rows: Record< string, unknown > }, id: string ) =>
				state.rows[ id ] ?? null,
			getLogDeleteRequest: ( state: { deleteRequest: unknown } ) => state.deleteRequest,
			getLogVersion: ( state: { logVersion: number } ) => state.logVersion,
		},
	} );
	register( sendStore );
	return {
		sendStore,
		useSendStatus: () => ( { status: mockStatus, error: null, retry: jest.fn() } ),
		useLogVersion: () =>
			useSelect(
				( select: ( store: unknown ) => { getLogVersion: () => number } ) =>
					select( sendStore ).getLogVersion(),
				[]
			),
	};
} );

const row = ( overrides: Partial< LogRow > = {} ): LogRow => ( {
	id: '1',
	created_at: '2026-10-18 09:00:00',
	recipients: 'customer@example.org',
	subject: 'New order #1042',
	status: 'sent',
	error: '',
	request_id: 'r1',
	source: 'wp_mail',
	...overrides,
} );

const testRow = ( overrides: Partial< LogRow > = {} ) =>
	row( {
		id: '42',
		recipients: 'owner@example.org',
		subject: 'Test email from Example Site',
		source: 'test',
		...overrides,
	} );

const entryFor = ( logRow: LogRow ): LogEntry => ( {
	...logRow,
	message: {
		from: null,
		reply_to: null,
		cc: [],
		bcc: [],
		content_type: 'text/plain',
		body: 'Hello',
		attachments: [],
	},
	detail: null,
	resend: { allowed: true, reason: '', locked: false },
	resends: [],
	resend_count: 0,
	resend_of_entry: null,
	resent_by: '',
	debug_count: 0,
	support_text: '',
} );

const mockLog = ( items: LogRow[], extra: Partial< LogPage > = {} ) =>
	jest.mocked( fetchLog ).mockResolvedValue( { items, total: items.length, ...extra } );

/**
 * The query the Log last asked for.
 *
 * @return The query.
 */
const lastQuery = (): LogQuery => jest.mocked( fetchLog ).mock.lastCall?.[ 0 ] as LogQuery;

/**
 * What the router does with the calls the Log makes: in-app hrefs and search updates.
 *
 * @param options        - The navigate options.
 * @param options.href   - An in-app href like `/log?entry=42`.
 * @param options.search - A search object, or a function of the current one.
 */
const routerNavigate = ( {
	href,
	search,
}: {
	href?: string;
	search?:
		| Record< string, unknown >
		| ( ( prev: Record< string, unknown > ) => Record< string, unknown > );
} ) => {
	let next = mockRouter.search;
	if ( typeof search === 'function' ) {
		next = search( mockRouter.search );
	} else if ( search ) {
		next = search;
	} else if ( href !== undefined ) {
		next = Object.fromEntries( new URLSearchParams( href.split( '?' )[ 1 ] ?? '' ) );
	}
	mockRouter.search = Object.fromEntries(
		Object.entries( next ).filter( ( [ , value ] ) => value !== undefined )
	);
	// The router re-renders after the call returns, as the real one does.
	setTimeout( () => act( () => mockRouter.listeners.forEach( listener => listener() ) ) );
};

/**
 * The address changing from outside the Log: Back, or a pasted link.
 *
 * @param search - The new search params.
 */
const visit = ( search: Record< string, unknown > ) => {
	act( () => {
		mockRouter.search = search;
		mockRouter.listeners.forEach( listener => listener() );
	} );
};

const renderLog = () =>
	render(
		<>
			<LogScreen />
			<Inspector />
		</>
	);

const rowFor = ( subject: string ) =>
	screen.getAllByText( subject )[ 0 ].closest( 'tr' ) as HTMLElement;
/**
 * The table row's clickable title for a subject. The panel's heading can have the same words and
 * render first, so it's found by the button around it, and throws until the row is there.
 *
 * @param subject - The email's subject.
 * @return The title.
 */
const clickableTitle = ( subject: string ) => {
	const title = screen
		.getAllByText( subject )
		.map( element => element.closest< HTMLElement >( '[role="button"]' ) )
		.find( Boolean );
	if ( ! title ) {
		throw new Error( `No clickable title for “${ subject }” yet.` );
	}
	return title;
};
const findClickableTitle = ( subject: string ) => waitFor( () => clickableTitle( subject ) );
const panelFor = ( subject: string ) => screen.findByRole( 'region', { name: subject } );
const dateButton = () => screen.getByRole( 'button', { name: /^Date range:/ } );
const searchBox = () => screen.getByRole( 'searchbox', { name: 'Search emails' } );

beforeEach( () => {
	jest.clearAllMocks();
	mockRouter.search = {};
	mockNavigate.mockImplementation( routerNavigate );
	mockStatus.onboarding.auto_test_log_id = null;
	mockStatus.provisioner = 'wpcom';
	mockStatus.log_retention_days = 30;
	mockStatus.log_retention_locked = false;
	mockStatus.log_trimmed_before = null;
	mockStatus.has_history = false;
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=jetpack-send' );
	jest
		.mocked( fetchLogEntry )
		.mockImplementation( id => Promise.reject( new Error( `unexpected fetch ${ id }` ) ) );
	jest
		.mocked( getOriginOptions )
		.mockResolvedValue( [ { value: 'plugin:shop-orders-lite', label: 'Shop Orders Lite' } ] );
} );

describe( 'LogScreen landing', () => {
	it.each( [
		[
			'in-app navigation',
			{ entry: 42, from: 'setup' },
			'/wp-admin/admin.php?page=jetpack-send&p=%2Flog%3Fentry%3D42%26from%3Dsetup',
		],
		[
			'a cold load from the email link',
			{},
			'/wp-admin/admin.php?page=jetpack-send&p=%2Flog&entry=42',
		],
	] )( 'opens the linked email beside the list from %s', async ( _, search, url ) => {
		mockRouter.search = search;
		window.history.replaceState( null, '', url );
		mockLog( [ testRow(), row() ] );
		jest.mocked( fetchLogEntry ).mockResolvedValue( entryFor( testRow() ) );

		renderLog();

		const panel = await panelFor( 'Test email from Example Site' );
		expect( within( panel ).getByText( 'This is your test email.' ) ).toBeVisible();
		expect( window.location.search ).not.toMatch( /[?&](entry|from)=/ );
		expect( mockRouter.search ).toEqual( { entry: 42 } );
		expect( mockNavigate ).toHaveBeenCalledWith(
			expect.objectContaining( { replace: true, viewTransition: false } )
		);
		const title = await findClickableTitle( 'Test email from Example Site' );
		expect( within( title ).getByText( 'Test' ) ).toBeVisible();
		expect( title.querySelector( '[data-open]' ) ).not.toBeNull();
		expect( clickableTitle( 'New order #1042' ).querySelector( '[data-open]' ) ).toBeNull();
		await waitFor( () =>
			expect( within( panel ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus()
		);
	} );

	it( 'pins the linked email above the table when it is not on the first page', async () => {
		mockRouter.search = { entry: '42' };
		mockLog( [ row() ] );
		jest.mocked( fetchLogEntry ).mockResolvedValue( entryFor( testRow() ) );

		renderLog();

		await panelFor( 'Test email from Example Site' );
		const pinned = await waitFor( () => {
			const button = document.querySelector( '.jetpack-send-log__pinned-row' );
			expect( button ).not.toBeNull();
			return button as HTMLElement;
		} );
		expect( pinned.querySelector( '[data-open]' ) ).not.toBeNull();
		expect( fetchLogEntry ).toHaveBeenCalledWith( '42' );
	} );

	it( 'says so when a link points at an email that was deleted, and closes the panel', async () => {
		mockRouter.search = { entry: '77' };
		mockLog( [ row() ] );

		renderLog();

		await expect(
			screen.findByText( 'That email is no longer in the log.' )
		).resolves.toBeVisible();
		await waitFor( () => expect( mockRouter.search ).toEqual( {} ) );
		await waitFor( () => expect( document.querySelector( '.jetpack-send-panel' ) ).toBeNull() );
	} );
} );

describe( 'LogScreen side panel', () => {
	const openRow = async ( logRow: LogRow ) => {
		mockLog( [ logRow ] );
		jest.mocked( fetchLogEntry ).mockResolvedValue( entryFor( logRow ) );
		renderLog();
		await expect( screen.findByText( logRow.subject ) ).resolves.toBeVisible();
		await userEvent.click( clickableTitle( logRow.subject ) );
		const panel = await panelFor( logRow.subject );
		await expect(
			within( panel ).findByText( 'Your host’s default sender' )
		).resolves.toBeVisible();
		return panel;
	};

	it( 'opens beside the list, marks the row and takes focus, then gives focus back on Escape', async () => {
		const panel = await openRow( row() );

		expect( mockRouter.search ).toEqual( { entry: 1 } );
		expect( clickableTitle( 'New order #1042' ).querySelector( '[data-open]' ) ).not.toBeNull();
		expect( document.querySelector( '.jetpack-send-has-panel' ) ).not.toBeNull();
		await waitFor( () =>
			expect( within( panel ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus()
		);

		await userEvent.keyboard( '{Escape}' );

		expect( mockRouter.search ).toEqual( {} );
		await waitFor( () => expect( document.querySelector( '.jetpack-send-panel' ) ).toBeNull() );
		await waitFor( () => expect( clickableTitle( 'New order #1042' ) ).toHaveFocus() );
	} );

	it( 'says a sent test was handed over, never delivered, and flags the automatic one', async () => {
		mockStatus.onboarding.auto_test_log_id = '42';
		const panel = await openRow( testRow() );

		expect( within( panel ).getByText( 'This is your test email.' ) ).toBeVisible();
		expect( within( panel ).getByText( /handed it to the mail service/ ) ).toHaveTextContent(
			'We sent this automatically when example.com finished connecting.'
		);
		expect( panel ).not.toHaveTextContent( /delivered/i );
	} );

	it( 'maps a failed test to a plain fix and sends people back to the records', async () => {
		const panel = await openRow(
			testRow( { status: 'failed', error: '550 5.7.1 Sender not allowed by Domain Lockdown' } )
		);

		expect( within( panel ).getByText( 'This test didn’t go through.' ) ).toBeVisible();
		expect(
			within( panel ).getByText(
				/^example\.com hasn’t given Jetpack permission to send yet\. Record 1 isn’t showing up\./
			)
		).toBeVisible();

		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Check your records' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/' } );
	} );

	it.each( [
		[ 'unreachable', 'cURL error 28: Operation timed out' ],
		[ 'refused for the account', 'HTTP 403: Can only send to verified email addresses' ],
		[ 'service error', 'The sending service returned HTTP 503.' ],
	] )(
		'says a test that failed on our side is on our side, with support, not the records (%s)',
		async ( _, error ) => {
			const panel = await openRow( testRow( { status: 'failed', error } ) );

			expect(
				within( panel ).getByText( /^The problem is on our side, not your site\./ )
			).toBeVisible();
			expect( within( panel ).getByRole( 'link', { name: /Contact support/ } ) ).toHaveAttribute(
				'href',
				SUPPORT_URL
			);
			expect(
				within( panel ).queryByRole( 'button', { name: 'Check your records' } )
			).not.toBeInTheDocument();
		}
	);

	it( 'never sends people to their records for a reason nobody recognises', async () => {
		const panel = await openRow( testRow( { status: 'failed', error: 'Something odd happened' } ) );

		expect( within( panel ).getByText( 'This test didn’t go through.' ) ).toBeVisible();
		expect(
			within( panel ).getByText(
				'Something went wrong. Try again in a minute. If it fails again, contact support and paste the details.'
			)
		).toBeVisible();
		expect( within( panel ).getByRole( 'link', { name: /Contact support/ } ) ).toBeVisible();
		expect(
			within( panel ).queryByRole( 'button', { name: 'Check your records' } )
		).not.toBeInTheDocument();
	} );

	it( 'gives a site email the receiving server turned down its own plain reason', async () => {
		const panel = await openRow(
			row( { status: 'failed', error: 'Mock: recipient domain rejected the message.' } )
		);

		expect(
			within( panel ).getByText(
				'The receiving mail server turned it down. Check the address is right, then resend it.'
			)
		).toBeVisible();
		// The service's own words only once Technical details is opened.
		expect( within( panel ).queryByText( /Mock: recipient domain/ ) ).not.toBeInTheDocument();
		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Technical details' } ) );
		expect( within( panel ).getByText( /Mock: recipient domain/ ) ).toBeVisible();
	} );

	it( 'says a site email the host sent instead failed on our side, keeping the service’s words in the details', async () => {
		const panel = await openRow(
			row( { status: 'fallback', error: 'HTTP 403: Can only send to verified email addresses' } )
		);

		expect( within( panel ).getByText( 'Jetpack Send couldn’t send this.' ) ).toBeVisible();
		expect(
			within( panel ).getByText(
				'The problem is on our side, not your site. Your host sent it instead.'
			)
		).toBeVisible();
		expect( within( panel ).getByRole( 'link', { name: /Contact support/ } ) ).toBeVisible();
		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Technical details' } ) );
		expect(
			within( panel ).getByText( 'HTTP 403: Can only send to verified email addresses' )
		).toBeInTheDocument();
	} );

	it( 'names the development account’s limit in development mode, without a support link', async () => {
		mockStatus.provisioner = 'local';
		const panel = await openRow(
			testRow( { status: 'failed', error: 'HTTP 403: Can only send to verified email addresses' } )
		);

		expect(
			within( panel ).getByText( 'This sending account can only email verified addresses.' )
		).toBeVisible();
		expect(
			within( panel ).queryByRole( 'link', { name: /Contact support/ } )
		).not.toBeInTheDocument();
	} );

	it( 'deletes from the panel after the Log’s warning, closes it and focuses the next row', async () => {
		const panel = await openRow( row() );
		jest.mocked( deleteLogEntries ).mockResolvedValue( { deleted: [ '1' ], missing: [] } );

		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Delete' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toHaveTextContent( 'Delete this email from the log?' );
		mockLog( [ row( { id: '2', subject: 'Password reset' } ) ] );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Delete' } ) );

		await expect( screen.findByText( '1 email deleted.' ) ).resolves.toBeVisible();
		expect( deleteLogEntries ).toHaveBeenCalledWith( [ '1' ] );
		expect( mockRouter.search ).toEqual( {} );
		await waitFor( () => expect( document.querySelector( '.jetpack-send-panel' ) ).toBeNull() );
		await waitFor( () => expect( clickableTitle( 'Password reset' ) ).toHaveFocus() );
	} );
} );

describe( 'LogScreen list', () => {
	it( 'explains a failure in plain words in the status tooltip, never the service’s own text', async () => {
		mockLog( [ row( { status: 'failed', error: 'The sending service returned HTTP 503.' } ) ] );

		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
		expect(
			within( rowFor( 'New order #1042' ) ).getByText(
				/^Jetpack Send couldn’t send this\. The problem is on our side, not your site\./
			)
		).toBeInTheDocument();
		expect( rowFor( 'New order #1042' ) ).not.toHaveTextContent( /MailChannels|HTTP 503/ );
	} );

	it( 'marks a copy sent again from the Log', async () => {
		mockLog( [ row( { id: '8', source: 'resend', resend_of: '1' } ) ] );

		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
		expect( within( clickableTitle( 'New order #1042' ) ).getByText( 'Resent' ) ).toBeVisible();
	} );
} );

describe( 'LogScreen view options', () => {
	it( 'offers the columns, but not Type, which is a filter only', async () => {
		const user = userEvent.setup();
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await user.click( screen.getByRole( 'button', { name: 'View options' } ) );

		// DataViews lists the columns it can show or hide by their labels.
		await waitFor( () =>
			expect( document.querySelectorAll( '.dataviews-view-config__label' ).length ).toBeGreaterThan(
				0
			)
		);
		const columns = Array.from(
			document.querySelectorAll( '.dataviews-view-config__label' ),
			label => label.textContent
		);
		expect( columns ).toEqual( expect.arrayContaining( [ 'Recipients', 'Source' ] ) );
		expect( columns ).not.toContain( 'Type' );
	} );
} );

describe( 'LogScreen address', () => {
	it.each< [ string, Record< string, unknown >, Partial< LogQuery > ] >( [
		[ 'status=failed', { status: 'failed' }, { status: [ 'failed' ] } ],
		[
			'status=failed,fallback&source=wp_mail,resend&range=90',
			{ status: 'failed,fallback', source: 'wp_mail,resend', range: 90 },
			{ status: [ 'failed', 'fallback' ], source: [ 'wp_mail', 'resend' ], period: { range: 90 } },
		],
		[
			'origin=plugin:shop-orders-lite',
			{ origin: 'plugin:shop-orders-lite' },
			{ origin: [ 'plugin:shop-orders-lite' ] },
		],
		[ 'search=1048, which the router reads as a number', { search: 1048 }, { search: '1048' } ],
		[
			'status=bounced&source=cron&days=-3, which it doesn’t know',
			{ status: 'bounced', source: 'cron', days: -3 },
			{},
		],
	] )( 'starts with what ?%s asks for, in one request', async ( _, search, query ) => {
		mockRouter.search = search;
		mockLog( [ row() ] );

		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeInTheDocument();
		expect( fetchLog ).toHaveBeenCalledTimes( 1 );
		expect( fetchLog ).toHaveBeenCalledWith(
			{ page: 1, per_page: 20, period: null, ...query },
			{ signal: expect.any( AbortSignal ) }
		);
	} );

	it( 'keeps status and type in the address, and shows a typed number as text in the box', async () => {
		mockRouter.search = { status: 'failed', source: 'wp_mail', search: 1048 };
		mockLog( [ row() ] );

		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeInTheDocument();
		expect( searchBox() ).toHaveValue( '1048' );
		expect( mockRouter.search ).toEqual( { status: 'failed', source: 'wp_mail', search: 1048 } );
		expect( screen.getByText( 'Failed' ) ).toBeVisible();
	} );

	it( 'turns an older days link into the period it means, then rewrites the address', async () => {
		mockRouter.search = { status: 'failed', days: 30 };
		mockLog( [ row() ] );

		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeInTheDocument();
		expect( lastQuery().period ).toEqual( { range: 30 } );
		expect( dateButton() ).toHaveTextContent( 'Last 30 days' );
		await waitFor( () => expect( mockRouter.search ).toEqual( { status: 'failed', range: 30 } ) );
		expect( fetchLog ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'follows the address when it changes from outside, as on Back', async () => {
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		visit( { status: 'fallback', search: 'jordan', entry: 1 } );

		await waitFor( () => expect( lastQuery().status ).toEqual( [ 'fallback' ] ) );
		expect( lastQuery().search ).toBe( 'jordan' );
		await waitFor( () => expect( searchBox() ).toHaveValue( 'jordan' ) );
		expect( screen.getByText( 'Sent by your host' ) ).toBeVisible();
	} );
} );

describe( 'LogScreen search', () => {
	it( 'searches once typing stops, writing the text to the address in place', async () => {
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.type( searchBox(), 'j' );
		await act( () => new Promise( resolve => setTimeout( resolve, 300 ) ) );
		// One letter searches nothing.
		expect( fetchLog ).toHaveBeenCalledTimes( 1 );

		await userEvent.type( searchBox(), 'ordan' );

		await waitFor( () => expect( lastQuery().search ).toBe( 'jordan' ) );
		expect( mockNavigate ).toHaveBeenLastCalledWith(
			expect.objectContaining( { replace: true, viewTransition: false } )
		);
		await waitFor( () => expect( mockRouter.search ).toEqual( { search: 'jordan' } ) );
	} );

	it( 'cancels the last search when a new one starts, without showing the cancel as an error', async () => {
		const signals: AbortSignal[] = [];
		jest.mocked( fetchLog ).mockImplementation( ( query, { signal } = {} ) => {
			signals.push( signal as AbortSignal );
			if ( query.search === 'jo' ) {
				return new Promise( ( _, reject ) =>
					signal?.addEventListener( 'abort', () =>
						reject( { name: 'AbortError', message: 'The operation was aborted.' } )
					)
				);
			}
			return Promise.resolve( { items: [ row() ], total: 1 } );
		} );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.type( searchBox(), 'jo' );
		await waitFor( () => expect( lastQuery().search ).toBe( 'jo' ) );
		await userEvent.type( searchBox(), 'rdan' );

		await waitFor( () => expect( lastQuery().search ).toBe( 'jordan' ) );
		expect( signals[ 1 ].aborted ).toBe( true );
		expect( screen.queryByText( 'The operation was aborted.' ) ).not.toBeInTheDocument();
	} );

	it( 'says when more emails match than it counts, and when text was too many to search', async () => {
		mockRouter.search = { search: 'order' };
		mockLog( [ row() ], { total: 1000, total_capped: true, searched_text: false } );

		renderLog();

		await expect(
			screen.findByText(
				'Searching addresses and subjects only. Pick a shorter date range to search inside emails too. More than 1,000 emails match. Add words or pick dates to narrow it down.'
			)
		).resolves.toBeVisible();
	} );

	it.each( [
		[
			'in the dates picked',
			{ search: 'jordan', range: 7 },
			{},
			'Search looked at addresses, subjects and email text in the last 7 days.',
			[ 'Clear search', 'Search all dates' ],
		],
		[
			'across every date',
			{ search: 'jordan' },
			{},
			'Search looked at the addresses, subjects and text of every email in your log.',
			[ 'Clear search' ],
		],
		[
			'in addresses and subjects only',
			{ search: 'jordan', range: 7 },
			{ searched_text: false },
			'Search looked at addresses and subjects only. There are too many emails to search inside them, so pick a shorter date range.',
			[ 'Clear search' ],
		],
	] )(
		'says what it looked at when nothing matches %s',
		async ( _, search, page, copy, actions ) => {
			mockRouter.search = search;
			mockLog( [], page );

			renderLog();

			await expect( screen.findByText( 'No emails match “jordan”' ) ).resolves.toBeVisible();
			expect( screen.getByText( copy ) ).toBeVisible();
			const empty = screen.getByText( copy ).closest( '.jetpack-send-log__empty' ) as HTMLElement;
			expect(
				within( empty )
					.getAllByRole( 'button' )
					.map( button => button.textContent )
			).toEqual( actions );
		}
	);

	it( 'puts focus in the search box after Clear search, since the button leaves with the empty state', async () => {
		mockRouter.search = { search: 'jordan' };
		mockLog( [] );
		renderLog();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Clear search' } ) );

		await waitFor( () => expect( searchBox() ).toHaveFocus() );
		expect( lastQuery().search ).toBeUndefined();
	} );

	it( 'searches every date from the empty state, keeping the words and focus in the search box', async () => {
		mockRouter.search = { search: 'jordan', range: 7 };
		mockLog( [] );
		renderLog();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Search all dates' } ) );

		await waitFor( () => expect( lastQuery().period ).toBeNull() );
		expect( lastQuery().search ).toBe( 'jordan' );
		// The button only shows while a date is set, so it leaves whatever the wider search finds.
		await waitFor( () => expect( searchBox() ).toHaveFocus() );
	} );
} );

describe( 'LogScreen filters', () => {
	it( 'shows Status and Source on arrival with no funnel, and offers Type under Add filter', async () => {
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		const chips = Array.from( document.querySelectorAll( '.dataviews-filters__summary-chip' ) );
		expect( chips.map( chip => chip.textContent ) ).toEqual( [ 'Source', 'Status' ] );
		expect( document.querySelector( '.dataviews-filters__visibility-toggle' ) ).toBeNull();
		await userEvent.click( screen.getByRole( 'button', { name: 'Add filter' } ) );
		await expect( screen.findByRole( 'menuitem', { name: 'Type' } ) ).resolves.toBeVisible();
		expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
	} );

	it( 'loads the Source options once, however often the list renders', async () => {
		mockLog( [ row() ] );
		jest.mocked( fetchLogEntry ).mockResolvedValue( entryFor( row() ) );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.click( clickableTitle( 'New order #1042' ) );
		await panelFor( 'New order #1042' );

		expect( getOriginOptions ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'filters by type, resends included', async () => {
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Add filter' } ) );
		await userEvent.click( await screen.findByRole( 'menuitem', { name: 'Type' } ) );
		await userEvent.click( await screen.findByRole( 'option', { name: 'Resends' } ) );

		await waitFor( () => expect( lastQuery().source ).toEqual( [ 'resend' ] ) );
		await waitFor( () => expect( mockRouter.search ).toEqual( { source: 'resend' } ) );
		// DataViews' own option list warns about its focus setup outside a real browser.
		expect( console ).toHaveWarned();
	} );

	it( 'clears the date with Reset, but keeps it when one chip is cleared', async () => {
		mockRouter.search = { status: 'failed', origin: 'plugin:shop-orders-lite', range: 7 };
		mockLog( [ row() ] );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
		const statusChip = screen
			.getByText( 'Status includes:' )
			.closest( '.dataviews-filters__summary-chip-container' ) as HTMLElement;

		await userEvent.click( within( statusChip ).getByRole( 'button', { name: 'Reset' } ) );
		await waitFor( () => expect( lastQuery().status ).toBeUndefined() );
		expect( lastQuery().period ).toEqual( { range: 7 } );

		await userEvent.click(
			document.querySelector( '.dataviews-filters__reset-button' ) as HTMLElement
		);
		await waitFor( () => expect( lastQuery().origin ).toBeUndefined() );
		expect( lastQuery().period ).toBeNull();
		expect( dateButton() ).toHaveTextContent( 'Any date' );
		await waitFor( () => expect( mockRouter.search ).toEqual( {} ) );
	} );

	it( 'offers a way out of an empty filtered view that clears the date too', async () => {
		mockRouter.search = { status: 'failed', range: 7 };
		mockLog( [] );
		renderLog();

		await expect( screen.findByText( 'No emails match these filters' ) ).resolves.toBeVisible();
		await userEvent.click( screen.getByRole( 'button', { name: 'Reset filters' } ) );

		await waitFor( () =>
			expect( fetchLog ).toHaveBeenLastCalledWith(
				{ page: 1, per_page: 20, period: null },
				{ signal: expect.any( AbortSignal ) }
			)
		);
		// The button left with the empty state, so focus waits in the search box, not on the page.
		await waitFor( () => expect( searchBox() ).toHaveFocus() );
	} );
} );

describe( 'LogScreen retention', () => {
	it( 'says how long emails are kept, with a way to change it', async () => {
		mockLog( [ row() ] );
		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
		const line = document.querySelector( '.jetpack-send-log__kept' ) as HTMLElement;
		expect( line ).toHaveTextContent( 'Emails are kept for 1 month. Change' );
		expect( within( line ).getByRole( 'link', { name: 'Change' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( encodeURIComponent( '/settings?edit=log' ) )
		);
	} );

	it( 'says older emails were deleted when the period reaches back past them', async () => {
		mockStatus.log_trimmed_before = new Date( Date.now() - 30 * 86400000 ).toISOString();
		mockRouter.search = { range: 90 };
		mockLog( [ row() ] );
		renderLog();

		await expect(
			screen.findByText(
				/^The log keeps emails for 1 month, so it starts on .+\. Your dashboard still counts older ones\.$/
			)
		).resolves.toBeVisible();
		await userEvent.click( screen.getByRole( 'button', { name: 'Change how long' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/settings?edit=log' } );
	} );

	it( 'gives no reason when the log starts later than how long it keeps emails explains', async () => {
		// As after a shorter period was kept for a while, or emails were deleted by hand.
		mockStatus.log_trimmed_before = new Date( Date.now() - 3 * 86400000 ).toISOString();
		mockRouter.search = { range: 90 };
		mockLog( [ row() ] );
		renderLog();

		await expect(
			screen.findByText(
				/^Older emails were deleted from the log, so it starts on .+\. Your dashboard still counts them\.$/
			)
		).resolves.toBeVisible();
		expect( screen.queryByRole( 'button', { name: 'Change how long' } ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing about deleted emails when none were', async () => {
		mockRouter.search = { range: 90 };
		mockLog( [ row() ] );
		renderLog();

		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
		expect( screen.queryByText( /so it starts on/ ) ).not.toBeInTheDocument();
	} );

	it( 'explains an empty log on a site that has sent email, once', async () => {
		mockStatus.has_history = true;
		mockLog( [] );
		renderLog();

		await expect( screen.findByText( 'No emails in the log right now' ) ).resolves.toBeVisible();
		expect(
			screen.getByText(
				'The log keeps emails for 1 month. Older ones were deleted, but your dashboard still counts them.'
			)
		).toBeVisible();
		expect( document.querySelector( '.jetpack-send-log__kept' ) ).toBeNull();
	} );

	it( 'never mentions retention on a log that has never had an email', async () => {
		mockLog( [] );
		renderLog();

		await expect( screen.findByText( 'No emails yet' ) ).resolves.toBeVisible();
		expect( screen.getAllByText( /Emails are kept for/ ) ).toHaveLength( 1 );
	} );
} );

describe( 'LogScreen delete', () => {
	it( 'deletes one email after a plain warning, then reloads the log and the Overview numbers', async () => {
		mockLog( [ row(), row( { id: '2', subject: 'Password reset' } ) ] );
		jest.mocked( deleteLogEntries ).mockResolvedValue( { deleted: [ '1' ], missing: [] } );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.click(
			within( rowFor( 'New order #1042' ) ).getByRole( 'button', { name: 'Actions' } )
		);
		await userEvent.click( await screen.findByRole( 'menuitem', { name: 'Delete' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toHaveTextContent( 'Delete this email from the log?' );
		expect( dialog ).toHaveTextContent( /Your dashboard numbers stay\./ );
		expect( dialog ).toHaveTextContent( /can’t be undone/ );
		mockLog( [ row( { id: '2', subject: 'Password reset' } ) ] );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Delete' } ) );

		await expect( screen.findByText( '1 email deleted.' ) ).resolves.toBeVisible();
		expect( deleteLogEntries ).toHaveBeenCalledWith( [ '1' ] );
		expect( mockLogChanged ).toHaveBeenCalled();
		expect( fetchLog ).toHaveBeenCalledTimes( 2 );
		// Focus lands on the row that took the deleted one's place, not on the page.
		await waitFor( () => expect( clickableTitle( 'Password reset' ) ).toHaveFocus() );
	} );

	it( 'deletes the checked emails together, and keeps the warning open with the reason when it fails', async () => {
		mockLog( [ row(), row( { id: '2', subject: 'Password reset' } ) ] );
		jest.mocked( deleteLogEntries ).mockRejectedValueOnce( new Error( 'The server said no.' ) );
		renderLog();
		await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();

		await userEvent.click( within( rowFor( 'New order #1042' ) ).getByRole( 'checkbox' ) );
		await userEvent.click( within( rowFor( 'Password reset' ) ).getByRole( 'checkbox' ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toHaveTextContent( 'Delete 2 emails from the log?' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Delete 2 emails' } ) );

		await expect( within( dialog ).findByText( 'The server said no.' ) ).resolves.toBeVisible();
		expect( deleteLogEntries ).toHaveBeenCalledWith( [ '1', '2' ] );
		expect( mockLogChanged ).not.toHaveBeenCalled();
	} );
} );

describe( 'LogScreen load error', () => {
	it.each( [
		[
			'with no search or filters',
			{},
			[ 'No emails in the log right now', /Older ones were deleted/ ],
		],
		[ 'with a search', { search: 'jordan' }, [ 'No emails match “jordan”', /Search looked at/ ] ],
		[ 'with filters', { status: 'failed' }, [ 'No emails match these filters' ] ],
		[ 'with dates before the log starts', { range: 90 }, [ /so it starts on/ ] ],
	] )(
		'says the log didn’t load %s, claims nothing about what’s in it, and loads it on Try again',
		async ( _, search, claims ) => {
			const user = userEvent.setup();
			mockStatus.has_history = true;
			mockStatus.log_trimmed_before = new Date( Date.now() - 30 * 86400000 ).toISOString();
			mockRouter.search = search;
			jest.mocked( fetchLog ).mockRejectedValue( new Error( 'The server is down.' ) );
			renderLog();

			await expect( screen.findByText( 'The log didn’t load' ) ).resolves.toBeVisible();
			expect( screen.getByText( 'The server is down.' ) ).toBeVisible();
			claims.forEach( claim => expect( screen.queryByText( claim ) ).not.toBeInTheDocument() );
			expect( screen.queryByRole( 'button', { name: 'Change how long' } ) ).not.toBeInTheDocument();
			expect( speak ).toHaveBeenCalledWith(
				'The log didn’t load. The server is down.',
				'assertive'
			);

			mockLog( [ row() ] );
			const asked = jest.mocked( fetchLog ).mock.calls.length;
			await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );

			await expect( screen.findByText( 'New order #1042' ) ).resolves.toBeVisible();
			expect( jest.mocked( fetchLog ).mock.calls.length ).toBeGreaterThan( asked );
			expect( screen.queryByText( 'The log didn’t load' ) ).not.toBeInTheDocument();
			await waitFor( () => expect( searchBox() ).toHaveFocus() );
		}
	);
} );
