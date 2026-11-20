import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useCloseOnEscape from '../components/use-close-on-escape';

describe( 'useCloseOnEscape', () => {
	it.each( [
		[ 'Escape on the page closes', 'Escape', null, 1 ],
		[ 'other keys do nothing', 'Enter', null, 0 ],
		[ 'Escape inside an open menu leaves the inspector open', 'Escape', 'menu', 0 ],
	] )( '%s', async ( _name, key, role, calls ) => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		const target = document.createElement( 'button' );
		if ( role ) {
			const popup = document.createElement( 'div' );
			popup.setAttribute( 'role', role );
			popup.append( target );
			document.body.append( popup );
		} else {
			document.body.append( target );
		}

		target.focus();
		await userEvent.keyboard( `{${ key }}` );

		expect( onClose ).toHaveBeenCalledTimes( calls );
	} );
} );
