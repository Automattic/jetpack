/**
 * External dependencies
 */
import {
	useStatsAppReferrersMarkSpamMutation,
	useStatsAppReferrersUnmarkSpamMutation,
} from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../../../../tests/js/notice-test-utils';
import { useMarkAsSpam } from '../use-mark-as-spam';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsAppReferrersMarkSpamMutation: jest.fn(),
	useStatsAppReferrersUnmarkSpamMutation: jest.fn(),
} ) );

const markSpam = jest.fn();
const unmarkSpam = jest.fn();
const { registry, createErrorNotice, createSuccessNotice } = createNoticesRegistry();

/**
 * Offer one domain to mark, next to the domains the hook has hidden.
 *
 * @return The rendered markup.
 */
function Harness() {
	const { markAsSpam, spammedDomains } = useMarkAsSpam();

	return (
		<>
			<output>{ [ ...spammedDomains ].join( ',' ) }</output>
			<button onClick={ () => markAsSpam( 'spam.example' ) }>Mark as spam</button>
		</>
	);
}

/**
 * Render the harness and mark its domain.
 */
async function mark() {
	render(
		<RegistryProvider value={ registry }>
			<Harness />
		</RegistryProvider>
	);
	await userEvent.click( screen.getByRole( 'button', { name: 'Mark as spam' } ) );
}

/**
 * Press the Undo action of the success snackbar.
 */
async function undo() {
	const [ , { actions } ] = createSuccessNotice.mock.calls[ 0 ] as unknown as [
		string,
		{ actions: { label: string; onClick: () => Promise< void > }[] },
	];
	expect( actions[ 0 ].label ).toBe( 'Undo' );

	await act( () => actions[ 0 ].onClick() );
}

describe( 'useMarkAsSpam', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest
			.mocked( useStatsAppReferrersMarkSpamMutation )
			.mockReturnValue( { mutateAsync: markSpam } as never );
		jest
			.mocked( useStatsAppReferrersUnmarkSpamMutation )
			.mockReturnValue( { mutateAsync: unmarkSpam } as never );
	} );

	it( 'hides a marked domain and restores it from the snackbar Undo', async () => {
		markSpam.mockResolvedValue( { success: true } );
		unmarkSpam.mockResolvedValue( { success: true } );

		await mark();

		expect( markSpam ).toHaveBeenCalledWith( { domain: 'spam.example' } );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'spam.example' );
		expect( createSuccessNotice ).toHaveBeenCalledWith(
			'"spam.example" marked as spam.',
			expect.objectContaining( { type: 'snackbar', explicitDismiss: true } )
		);

		await undo();

		expect( unmarkSpam ).toHaveBeenCalledWith( { domain: 'spam.example' } );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'keeps the domain hidden when Undo fails', async () => {
		markSpam.mockResolvedValue( { success: true } );
		unmarkSpam.mockRejectedValue( { error: 'api_error' } );

		await mark();
		await undo();

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'spam.example' );
		expect( createErrorNotice ).toHaveBeenCalledWith(
			'Couldn’t undo marking "spam.example" as spam.',
			expect.objectContaining( { type: 'snackbar' } )
		);
		expect( console ).toHaveErrored();
	} );

	it.each( [
		[ 'reach-limit', 'You’ve reached the limit of spam referrers for this site.' ],
		[ 'api_error', 'Couldn’t mark "spam.example" as spam.' ],
	] )( 'keeps the row and explains a %s failure', async ( error, message ) => {
		markSpam.mockRejectedValue( { error } );

		await mark();

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		expect( createSuccessNotice ).not.toHaveBeenCalled();
		expect( createErrorNotice ).toHaveBeenCalledWith(
			message,
			expect.objectContaining( { type: 'snackbar' } )
		);
		expect( console ).toHaveErrored();
	} );

	it( 'hides a domain already marked elsewhere without offering Undo', async () => {
		markSpam.mockRejectedValue( { error: 'already-spammed' } );

		await mark();

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'spam.example' );
		expect( createErrorNotice ).not.toHaveBeenCalled();
		expect( createSuccessNotice ).toHaveBeenCalledWith(
			'"spam.example" was already marked as spam.',
			expect.not.objectContaining( { actions: expect.anything() } )
		);
	} );
} );
