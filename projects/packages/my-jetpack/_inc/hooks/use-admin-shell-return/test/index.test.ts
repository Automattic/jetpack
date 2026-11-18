import { renderHook } from '@testing-library/react';
import useAdminShellReturn from '..';

const shown = ( page: string, firstShow: boolean ) =>
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page, firstShow } } )
	);

describe( 'useAdminShellReturn', () => {
	it( 'calls back when the admin shell shows My Jetpack again, until unmounted', () => {
		const callback = jest.fn();
		const { unmount } = renderHook( () => useAdminShellReturn( callback ) );

		shown( 'my-jetpack', true );
		shown( 'jetpack-forms-responses-wp-admin', false );
		shown( 'my-jetpack', false );
		unmount();
		shown( 'my-jetpack', false );

		expect( callback ).toHaveBeenCalledTimes( 1 );
	} );
} );
