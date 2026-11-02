import { fireEvent, renderHook } from '@testing-library/react';
import useArrowKeyNavigation from '../components/use-arrow-key-navigation';

const items = [ 'a', 'b', 'c' ];
const getId = ( item: string ) => item;

describe( 'useArrowKeyNavigation', () => {
	it.each( [
		[ 'ArrowDown opens the next row', 'b', 'ArrowDown', 'button', 'c', false ],
		[ 'ArrowUp opens the previous row', 'b', 'ArrowUp', 'button', 'a', false ],
		[ 'the last row stays put without scrolling', 'c', 'ArrowDown', 'button', null, false ],
		[ 'a row on another page starts from this page', 'z', 'ArrowDown', 'button', 'a', false ],
		[ 'nothing open leaves the page to scroll', undefined, 'ArrowDown', 'button', null, true ],
		[ 'typing in a field moves its caret', 'b', 'ArrowDown', 'input', null, true ],
	] )( '%s', ( _name, selected, key, tag, expected, scrolls ) => {
		const open = jest.fn();
		renderHook( () => useArrowKeyNavigation( items, selected, getId, open ) );
		const target = document.createElement( tag );
		document.body.append( target );

		// fireEvent returns false once a handler prevents the key's default scroll; userEvent can't tell.
		// eslint-disable-next-line testing-library/prefer-user-event
		const isDefault = fireEvent.keyDown( target, { key } );

		expect( open.mock.calls ).toEqual( expected ? [ [ expected ] ] : [] );
		expect( isDefault ).toBe( scrolls );
		target.remove();
	} );
} );
