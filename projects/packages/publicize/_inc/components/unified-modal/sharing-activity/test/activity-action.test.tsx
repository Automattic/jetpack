import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityAction } from '../activity-action';
import type { ScheduledActivityItem } from '../types';

const mockDeleteScheduledShare = jest.fn();

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { recordEvent: jest.fn() } ),
} ) );

// Keeps @wordpress/editor out of the import graph.
jest.mock( '../../../../social-store', () => ( {
	store: 'jetpack-social',
} ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useDispatch: () => ( { deleteScheduledShare: mockDeleteScheduledShare } ),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

const item: ScheduledActivityItem = {
	id: 'scheduled-42',
	activityType: 'scheduled',
	status: 'scheduled',
	timestamp: 1700000000,
	serviceName: 'facebook',
	displayName: 'Example Page',
	profilePicture: '',
	scheduleId: 42,
};

describe( 'ActivityAction', () => {
	it( 'deletes a scheduled share and closes the confirmation', async () => {
		const user = userEvent.setup();
		render( <ActivityAction item={ item } /> );

		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );
		const dialog = await screen.findByRole( 'alertdialog', { name: 'Delete scheduled share' } );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Delete' } ) );

		expect( mockDeleteScheduledShare ).toHaveBeenCalledTimes( 1 );
		expect( mockDeleteScheduledShare ).toHaveBeenCalledWith( 42 );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
	} );
} );
