import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useArrowKeyNavigation from '../components/use-arrow-key-navigation';

const items = [ 'a', 'b', 'c' ];
const getId = ( item: string ) => item;

describe( 'useArrowKeyNavigation', () => {
	it.each( [
		[ 'ArrowDown opens the next row', 'b', 'ArrowDown', 'button', 'c' ],
		[ 'ArrowUp opens the previous row', 'b', 'ArrowUp', 'button', 'a' ],
		[ 'the last row stays put', 'c', 'ArrowDown', 'button', null ],
		[ 'a row on another page starts from this page', 'z', 'ArrowDown', 'button', 'a' ],
		[ 'nothing open leaves the page to scroll', undefined, 'ArrowDown', 'button', null ],
		[ 'typing in a field moves its caret', 'b', 'ArrowDown', 'input', null ],
	] )( '%s', async ( _name, selected, key, tag, expected ) => {
		const open = jest.fn();
		renderHook( () => useArrowKeyNavigation( items, selected, getId, open ) );
		const target = document.createElement( tag );
		document.body.append( target );

		target.focus();
		await userEvent.keyboard( `{${ key }}` );

		expect( open.mock.calls ).toEqual( expected ? [ [ expected ] ] : [] );
		target.remove();
	} );
} );
