import { render } from '@testing-library/react';
import useAdminMenuWidth from '../src/dashboard/hooks/use-admin-menu-width';

it( 'knows the admin menu width on its first render, before any effect runs', () => {
	globalThis.ResizeObserver = class {
		observe() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
	const content = document.createElement( 'div' );
	content.id = 'wpcontent';
	content.getBoundingClientRect = () => ( { width: 940 } ) as DOMRect;
	document.body.appendChild( content );
	jest.spyOn( document.documentElement, 'clientWidth', 'get' ).mockReturnValue( 1100 );

	const widths: number[] = [];
	const Probe = () => {
		widths.push( useAdminMenuWidth() );
		return null;
	};
	render( <Probe /> );

	expect( widths[ 0 ] ).toBe( 160 );
} );
