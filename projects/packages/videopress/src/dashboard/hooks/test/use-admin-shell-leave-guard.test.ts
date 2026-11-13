import { renderHook } from '@testing-library/react';
import { useAdminShellLeaveGuard } from '../use-admin-shell-leave-guard';

const leave = ( page: string ) => {
	const event = new CustomEvent( 'jetpack-admin-shell:before-leave', {
		detail: { page },
		cancelable: true,
	} );
	window.dispatchEvent( event );
	return event;
};

const MESSAGE = 'You have unsaved changes in VideoPress. Discard them?';

describe( 'useAdminShellLeaveGuard', () => {
	let confirm: jest.SpyInstance;
	beforeEach( () => {
		confirm = jest.spyOn( window, 'confirm' );
	} );
	afterEach( () => {
		confirm.mockRestore();
	} );

	it.each( [
		[ 'stays when the user cancels', 'jetpack-videopress', true, false, true ],
		[ 'goes on when the user confirms', 'jetpack-videopress', true, true, false ],
		[ 'goes on without asking when nothing is unsaved', 'jetpack-videopress', false, false, false ],
		[ 'ignores another page', 'jetpack-newsletter', true, false, false ],
	] )( '%s', ( _, page, dirty, ok, stays ) => {
		confirm.mockReturnValue( ok );
		const { unmount } = renderHook( () => useAdminShellLeaveGuard( () => dirty ) );

		expect( leave( page ).defaultPrevented ).toBe( stays );
		expect( confirm.mock.calls ).toEqual( stays || ok ? [ [ MESSAGE ] ] : [] );
		unmount();
		expect( leave( page ).defaultPrevented ).toBe( false );
	} );

	it( 'follows the latest unsaved state, and reports the ask only until the task ends', async () => {
		confirm.mockReturnValue( false );
		const { result, rerender } = renderHook(
			( { dirty } ) => useAdminShellLeaveGuard( () => dirty ),
			{ initialProps: { dirty: false } }
		);
		rerender( { dirty: true } );

		expect( leave( 'jetpack-videopress' ).defaultPrevented ).toBe( true );
		expect( result.current() ).toBe( true );
		await new Promise( resolve => setTimeout( resolve ) );
		expect( result.current() ).toBe( false );
	} );
} );
