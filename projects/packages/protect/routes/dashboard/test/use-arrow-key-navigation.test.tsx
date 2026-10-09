import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useArrowKeyNavigation from '../components/use-arrow-key-navigation';

const items = [ 'a', 'b', 'c' ];
const getId = ( item: string ) => item;

describe( 'useArrowKeyNavigation', () => {
	it.each( [
		[ 'ArrowDown opens the next row', 'b', '{ArrowDown}', 'button', null, 'c', true ],
		[ 'ArrowUp opens the previous row', 'b', '{ArrowUp}', 'button', null, 'a', true ],
		[
			'the last row stays put, and so does the page',
			'c',
			'{ArrowDown}',
			'button',
			null,
			null,
			true,
		],
		[
			'a row on another page starts from this page',
			'z',
			'{ArrowDown}',
			'button',
			null,
			'a',
			true,
		],
		[
			'nothing open leaves the page to scroll',
			undefined,
			'{ArrowDown}',
			'button',
			null,
			null,
			false,
		],
		[ 'typing in a field moves its caret', 'b', '{ArrowDown}', 'input', null, null, false ],
		[ 'a menu keeps its own arrow keys', 'b', '{ArrowDown}', 'button', 'menu', null, false ],
		[ 'a dialog keeps its own arrow keys', 'b', '{ArrowDown}', 'button', 'dialog', null, false ],
		[
			'a modifier key leaves the shortcut alone',
			'b',
			'{Shift>}{ArrowDown}{/Shift}',
			'button',
			null,
			null,
			false,
		],
	] )( '%s', async ( _name, selected, keys, tag, role, expected, isPrevented ) => {
		const open = jest.fn();
		renderHook( () => useArrowKeyNavigation( items, selected, getId, open ) );
		const prevented: boolean[] = [];
		const onKeyDown = ( event: KeyboardEvent ) =>
			event.key.startsWith( 'Arrow' ) && prevented.push( event.defaultPrevented );
		document.addEventListener( 'keydown', onKeyDown );
		const wrapper = document.createElement( 'div' );
		if ( role ) {
			wrapper.setAttribute( 'role', role );
		}
		const target = wrapper.appendChild( document.createElement( tag ) );
		document.body.append( wrapper );

		target.focus();
		await userEvent.keyboard( keys );

		expect( open.mock.calls ).toEqual( expected ? [ [ expected ] ] : [] );
		expect( prevented ).toEqual( [ isPrevented ] );
		document.removeEventListener( 'keydown', onKeyDown );
		wrapper.remove();
	} );
} );
