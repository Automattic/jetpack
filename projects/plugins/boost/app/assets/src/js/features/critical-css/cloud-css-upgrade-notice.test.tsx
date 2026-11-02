/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useSingleModuleState } from '$features/module/lib/stores';
import CloudCssUpgradeNotice from './cloud-css-upgrade-notice';

jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( { useDataSync: jest.fn() } ) );
jest.mock( '$features/module/lib/stores', () => ( { useSingleModuleState: jest.fn() } ) );

const dismiss = jest.fn();
const mockState = ( pending = true, active = true, available = true ) => {
	jest.mocked( useDataSync ).mockReturnValue( [ { data: pending }, { mutate: dismiss } ] as never );
	jest.mocked( useSingleModuleState ).mockReturnValue( [ { active, available }, jest.fn() ] );
};

beforeEach( () => {
	dismiss.mockClear();
	mockState();
} );

it( 'confirms automatic Critical CSS with the purchase wording and persists dismissal', () => {
	render( <CloudCssUpgradeNotice /> );
	expect( screen.getByText( 'Congratulations! Your Jetpack Boost is Now Upgraded!' ) ).toBeTruthy();
	expect(
		screen.getByText( 'No further action needed! Your Critical CSS is now set to auto-regenerate.' )
	).toBeTruthy();
	fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
	expect( dismiss ).toHaveBeenCalledWith( false );
} );

it.each( [
	[ 'no pending upgrade', false, true, true ],
	[ 'manually switched off', true, false, true ],
	[ 'feature unavailable', true, true, false ],
] )( 'does not confirm when %s', ( _name, pending, active, available ) => {
	mockState( pending as boolean, active as boolean, available as boolean );
	render( <CloudCssUpgradeNotice /> );
	expect( screen.queryByText( 'Congratulations! Your Jetpack Boost is Now Upgraded!' ) ).toBeNull();
} );
