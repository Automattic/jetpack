import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

const saveEntityRecord = jest.fn();
const invalidateCounts = jest.fn();

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: store => ( store === 'core-store' ? { saveEntityRecord } : { invalidateCounts } ),
} ) );
await jest.unstable_mockModule( '@wordpress/core-data', () => ( { store: 'core-store' } ) );
await jest.unstable_mockModule( '../../store/index.js', () => ( { store: 'dashboard-store' } ) );

const { useMarkAsSpam } = await import( '../use-mark-as-spam.ts' );

const inboxResponse = { id: 7, status: 'publish' };

const setup = ( response, options = {} ) => {
	const switchToSpam = jest.fn();
	const removeParameter = jest.fn();
	const checkParameter = jest.fn( () => options.hasParam ?? false );

	const { result, rerender } = renderHook( ( props = response ) =>
		useMarkAsSpam( props, { checkParameter, removeParameter, switchToSpam } )
	);

	return { result, rerender, switchToSpam, removeParameter, checkParameter };
};

describe( 'useMarkAsSpam', () => {
	beforeEach( () => {
		saveEntityRecord.mockReset();
		invalidateCounts.mockReset();
		invalidateCounts.mockResolvedValue( undefined );
	} );

	it( 'reports the change only when the save succeeds', async () => {
		saveEntityRecord.mockResolvedValue( { id: 7, status: 'spam' } );
		const { result, switchToSpam } = setup( inboxResponse );

		await act( async () => {
			await result.current.onConfirmMarkAsSpam();
		} );

		expect( switchToSpam ).toHaveBeenCalledWith( 7 );
	} );

	it( 'does not report the change when the save fails', async () => {
		// The regression this guards: core-data resolves `undefined` on a failed save
		// unless `throwOnError` is passed, so without it the hook would report success
		// and callers would repair the store for a change the server refused.
		saveEntityRecord.mockRejectedValue( new Error( 'nope' ) );
		const { result, switchToSpam } = setup( inboxResponse );

		await act( async () => {
			await result.current.onConfirmMarkAsSpam();
		} );

		expect( switchToSpam ).not.toHaveBeenCalled();
		expect( result.current.isSaving ).toBe( false );
	} );

	it( 'asks core-data to throw so failures are observable', async () => {
		saveEntityRecord.mockResolvedValue( { id: 7 } );
		const { result } = setup( inboxResponse );

		await act( async () => {
			await result.current.onConfirmMarkAsSpam();
		} );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'feedback',
			{ id: 7, status: 'spam' },
			{ throwOnError: true }
		);
	} );

	it( 'opens the dialog when the email trigger is present', async () => {
		const { result } = setup( inboxResponse, { hasParam: true } );

		await waitFor( () => expect( result.current.isConfirmDialogOpen ).toBe( true ) );
	} );

	it( 'arriving with the trigger does not mutate anything on its own', async () => {
		const { result } = setup( inboxResponse, { hasParam: true } );

		await waitFor( () => expect( result.current.isConfirmDialogOpen ).toBe( true ) );
		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	it.each( [ 'spam', 'trash' ] )(
		'consumes the trigger instead of leaving it armed for a %s response',
		async status => {
			// Left armed, the trigger re-fires the dialog unprompted as soon as a later
			// Not spam / Restore moves the response back to the inbox.
			const { result, removeParameter } = setup( { id: 7, status }, { hasParam: true } );

			await waitFor( () => expect( removeParameter ).toHaveBeenCalled() );
			expect( result.current.isConfirmDialogOpen ).toBe( false );
		}
	);
} );
