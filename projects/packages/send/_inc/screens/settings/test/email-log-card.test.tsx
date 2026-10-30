import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { fetchLogSummary, postAction } from '../../../data/api';
import EmailLogCard from '../email-log-card';
import type { LogSummary, SendStatus } from '../../../data/types';

const mockNavigate = jest.fn();
const mockSearch = jest.fn( () => ( {} ) );
jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch(),
} ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../../../data/api', () => ( {
	postAction: jest.fn(),
	fetchLogSummary: jest.fn(),
	errorMessage: ( e: { message?: string } ) => e?.message ?? 'Something went wrong.',
} ) );

const makeStatus = ( days: number, { locked = false } = {} ) =>
	( {
		settings: { log_retention_days: days },
		log_retention_days: days,
		log_retention_locked: locked,
	} ) as unknown as SendStatus;

const SUMMARY: LogSummary = {
	total: 1284,
	oldest_at: '2026-09-01T10:00:00Z',
	older_than: { '1': 1200, '7': 900, '30': 0, '90': 0, '180': 0, '365': 0 },
};

const select = () => screen.getByRole( 'combobox', { name: 'Keep emails for' } );

/**
 * Pick a choice in the select.
 *
 * @param user  - The user.
 * @param label - The choice.
 */
const pick = async ( user: ReturnType< typeof userEvent.setup >, label: string ) => {
	await user.click( select() );
	await user.click( await screen.findByRole( 'option', { name: label } ) );
};

describe( 'EmailLogCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSearch.mockReturnValue( {} );
		jest.mocked( fetchLogSummary ).mockResolvedValue( SUMMARY );
		jest
			.mocked( postAction )
			.mockImplementation( async ( _, data ) => makeStatus( Number( data?.log_retention_days ) ) );
	} );

	it( 'offers 1 day to Forever, and says how much the log holds', async () => {
		const user = userEvent.setup();
		render( <EmailLogCard status={ makeStatus( 30 ) } /> );

		await expect(
			screen.findByText( 'The log has 1,284 emails. The oldest is from Sep 1.' )
		).resolves.toBeInTheDocument();
		expect( select() ).toHaveTextContent( '1 month' );
		expect(
			screen.getByText( 'Older emails are deleted for good. Your dashboard numbers stay.' )
		).toBeInTheDocument();
		await user.click( select() );
		expect(
			( await screen.findAllByRole( 'option' ) ).map( option => option.textContent )
		).toEqual( [ '1 day', '1 week', '1 month', '3 months', '6 months', '1 year', 'Forever' ] );
	} );

	it.each( [
		[
			'Forever',
			0,
			'Emails stay until you delete them. The log grows with every email your site sends.',
		],
		[ '1 year', 365, 'Older emails are deleted for good. Your dashboard numbers stay.' ],
	] )( 'warns about personal data when keeping emails for %s', async ( _, days, description ) => {
		render( <EmailLogCard status={ makeStatus( days ) } /> );

		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( description ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'Emails can hold your customers’ names, addresses and messages. Keep them only as long as you need them.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows the site code’s value and can’t be changed when the code sets it', async () => {
		render( <EmailLogCard status={ makeStatus( 14, { locked: true } ) } /> );

		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();
		expect( select() ).toHaveTextContent( '14 days' );
		expect( select() ).toBeDisabled();
		expect( screen.getByText( 'Set by your site’s code.' ) ).toBeInTheDocument();
	} );

	it( 'saves a longer choice, or a shorter one with nothing older, without asking', async () => {
		const user = userEvent.setup();
		render( <EmailLogCard status={ makeStatus( 90 ) } /> );
		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();

		await pick( user, '1 month' );
		expect( postAction ).toHaveBeenCalledWith( 'settings', { log_retention_days: 30 } );
		await pick( user, 'Forever' );
		expect( postAction ).toHaveBeenLastCalledWith( 'settings', { log_retention_days: 0 } );
		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'asks with the real number before a shorter choice deletes emails, and Cancel puts it back', async () => {
		const user = userEvent.setup();
		render( <EmailLogCard status={ makeStatus( 30 ) } /> );
		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();

		await pick( user, '1 week' );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toHaveTextContent( 'Delete 900 older emails?' );
		expect( dialog ).toHaveTextContent(
			/deletes the 900 emails sent before .+\. This can’t be undone\./
		);
		expect( postAction ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( select() ).toHaveTextContent( '1 month' );
		await waitFor( () => expect( select() ).toHaveFocus() );
	} );

	it.each( [
		[ { deleted: 900, remaining: 0 }, 'Saved. 900 older emails were deleted.' ],
		[
			{ deleted: 500, remaining: 400 },
			'Saved. 500 older emails were deleted. The other 400 are being deleted in the background.',
		],
	] )( 'deletes on confirm and says how many went (%p)', async ( pruned, message ) => {
		const user = userEvent.setup();
		jest.mocked( postAction ).mockResolvedValue( { ...makeStatus( 7 ), pruned } );
		render( <EmailLogCard status={ makeStatus( 30 ) } /> );
		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();

		await pick( user, '1 week' );
		await user.click( await screen.findByRole( 'button', { name: 'Delete and save' } ) );

		await expect( screen.findByText( message ) ).resolves.toHaveAttribute( 'role', 'status' );
		expect( postAction ).toHaveBeenCalledWith( 'settings', { log_retention_days: 7 } );
		expect( speak ).toHaveBeenCalledWith( message );
		// On opening, again before asking, and after saving.
		expect( fetchLogSummary ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'counts again before a shorter choice, so a tab left open still asks', async () => {
		const user = userEvent.setup();
		// When the card opened, nothing was older than a week; days later, 40 are.
		jest
			.mocked( fetchLogSummary )
			.mockResolvedValueOnce( { ...SUMMARY, older_than: { ...SUMMARY.older_than, '7': 0 } } )
			.mockResolvedValue( { ...SUMMARY, older_than: { ...SUMMARY.older_than, '7': 40 } } );
		render( <EmailLogCard status={ makeStatus( 30 ) } /> );
		await expect( screen.findByText( /^The log has/ ) ).resolves.toBeInTheDocument();

		await pick( user, '1 week' );

		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toHaveTextContent(
			'Delete 40 older emails?'
		);
		expect( postAction ).not.toHaveBeenCalled();
	} );

	it( 'still asks when the count couldn’t load', async () => {
		const user = userEvent.setup();
		jest.mocked( fetchLogSummary ).mockRejectedValue( new Error( 'Down' ) );
		render( <EmailLogCard status={ makeStatus( 30 ) } /> );
		await waitFor( () => expect( fetchLogSummary ).toHaveBeenCalled() );

		await pick( user, '1 day' );
		await expect(
			screen.findByRole( 'alertdialog', { name: 'Delete emails older than 1 day?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^The log has/ ) ).not.toBeInTheDocument();
	} );

	it( 'focuses the select when a link lands on it, then drops the param', async () => {
		mockSearch.mockReturnValue( { edit: 'log' } );
		render( <EmailLogCard status={ makeStatus( 7 ) } /> );

		await waitFor( () => expect( select() ).toHaveFocus() );
		expect( mockNavigate ).toHaveBeenCalledWith( {
			href: '/settings',
			replace: true,
			viewTransition: false,
		} );
	} );
} );
