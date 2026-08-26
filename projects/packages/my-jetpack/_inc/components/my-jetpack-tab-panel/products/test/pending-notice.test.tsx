import { renderHook } from '@testing-library/react';
import {
	setPendingSuccessNotice,
	consumePendingSuccessNotice,
	useReplayPendingNotice,
} from '../pending-notice';

const mockCreateSuccessNotice = jest.fn();
jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: mockCreateSuccessNotice } ),
} ) );

describe( 'pending-notice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.sessionStorage.clear();
	} );

	it( 'stores then consumes a pending notice exactly once', () => {
		setPendingSuccessNotice( 'Forms activated successfully!' );

		expect( consumePendingSuccessNotice() ).toEqual( {
			message: 'Forms activated successfully!',
			customizeMenu: true,
		} );
		// Once consumed it is cleared.
		expect( consumePendingSuccessNotice() ).toBeNull();
	} );

	it( 'returns null when nothing is pending', () => {
		expect( consumePendingSuccessNotice() ).toBeNull();
	} );

	it( 'replays a pending notice on mount', () => {
		setPendingSuccessNotice( 'Forms activated successfully!' );

		renderHook( () => useReplayPendingNotice() );

		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Forms activated successfully!', {
			actions: [
				{
					label: 'Customize menu',
					url: 'admin.php?page=my-jetpack#/customize',
				},
			],
		} );
	} );

	it( 'reads legacy string notices without inventing a menu action', () => {
		window.sessionStorage.setItem( 'myJetpackPendingSuccessNotice', 'Legacy notice' );

		expect( consumePendingSuccessNotice() ).toEqual( {
			message: 'Legacy notice',
			customizeMenu: false,
		} );
	} );

	it( 'shows no notice when none is pending', () => {
		renderHook( () => useReplayPendingNotice() );

		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
