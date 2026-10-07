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
import { createNoticesRegistry } from '../../../../tests/js/notice-test-utils';
import { useMarkAsSpamAction } from './use-mark-as-spam-action';
import type { ReferrerRecord } from '@jetpack-premium-analytics/widgets-toolkit';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsAppReferrersMarkSpamMutation: jest.fn(),
	useStatsAppReferrersUnmarkSpamMutation: jest.fn(),
} ) );

const markSpam = jest.fn();
const unmarkSpam = jest.fn();
const closeModal = jest.fn();
const { registry, createErrorNotice, createSuccessNotice } = createNoticesRegistry();

const ITEM: ReferrerRecord = {
	id: '["spam.example"]',
	label: 'spam.example',
	views: 3,
	spamDomain: 'spam.example',
};

/**
 * Render the action's confirmation for one row, next to the domains it has hidden.
 *
 * @return The rendered markup.
 */
function Harness() {
	const { action, spammedDomains } = useMarkAsSpamAction();

	if ( ! ( 'RenderModal' in action ) ) {
		return null;
	}

	const { RenderModal } = action;

	return (
		<>
			<output>{ [ ...spammedDomains ].join( ',' ) }</output>
			<RenderModal items={ [ ITEM ] } closeModal={ closeModal } />
		</>
	);
}

/**
 * Render the confirmation and press its Mark as spam button.
 */
async function confirm() {
	render(
		<RegistryProvider value={ registry }>
			<Harness />
		</RegistryProvider>
	);
	await userEvent.click( screen.getByRole( 'button', { name: 'Mark as spam' } ) );
}

describe( 'useMarkAsSpamAction', () => {
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

		await confirm();

		expect( markSpam ).toHaveBeenCalledWith( { domain: 'spam.example' } );
		expect( closeModal ).toHaveBeenCalled();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'spam.example' );
		expect( createSuccessNotice ).toHaveBeenCalledWith(
			'"spam.example" marked as spam.',
			expect.objectContaining( { type: 'snackbar', explicitDismiss: true } )
		);

		const [ , { actions } ] = createSuccessNotice.mock.calls[ 0 ] as unknown as [
			string,
			{ actions: { label: string; onClick: () => Promise< void > }[] },
		];
		expect( actions[ 0 ].label ).toBe( 'Undo' );

		await act( () => actions[ 0 ].onClick() );

		expect( unmarkSpam ).toHaveBeenCalledWith( { domain: 'spam.example' } );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it.each( [
		[ 'reach-limit', 'You’ve reached the limit of 500 spam referrers.' ],
		[ 'api_error', 'Couldn’t mark "spam.example" as spam.' ],
	] )( 'keeps the row and explains a %s failure', async ( error, message ) => {
		markSpam.mockRejectedValue( { error } );

		await confirm();

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		expect( createSuccessNotice ).not.toHaveBeenCalled();
		expect( createErrorNotice ).toHaveBeenCalledWith(
			message,
			expect.objectContaining( { type: 'snackbar' } )
		);
	} );

	it( 'treats a domain already marked elsewhere as marked', async () => {
		markSpam.mockRejectedValue( { error: 'already-spammed' } );

		await confirm();

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'spam.example' );
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );
} );
