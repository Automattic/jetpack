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

describe( 'useAdminShellLeaveGuard', () => {
	it.each( [
		[ 'stays when the user cancels', 'jetpack-videopress', false, true ],
		[ 'goes on when the user confirms', 'jetpack-videopress', true, false ],
		[ 'ignores another page', 'jetpack-newsletter', false, false ],
	] )( '%s', ( _, page, ok, stays ) => {
		const { unmount } = renderHook( () => useAdminShellLeaveGuard( () => ok ) );

		expect( leave( page ).defaultPrevented ).toBe( stays );
		unmount();
		expect( leave( page ).defaultPrevented ).toBe( false );
	} );
} );
