import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const replaceBlocks = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	cloneBlock: jest.fn( block => block ),
	createBlock: jest.fn( name => ( { name, clientId: `new-${ name }` } ) ),
	getDefaultBlockName: () => 'core/paragraph',
} ) );

await jest.unstable_mockModule( '@wordpress/compose', () => ( {
	useRefEffect: jest.fn( callback => callback ),
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => ( {
		replaceBlocks,
		insertBlock: jest.fn(),
		selectionChange: jest.fn(),
	} ) ),
	useSelect: jest.fn( () => ( {
		getBlock: clientId => ( {
			clientId,
			innerBlocks: [ { clientId: 'label' }, { clientId: 'option' } ],
		} ),
		getBlockRootClientId: () => 'parent',
		getBlockIndex: () => 1,
	} ) ),
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useRef: jest.fn( current => ( { current } ) ),
} ) );

const useEnter = ( await import( '../use-enter.js' ) ).default;

describe( 'useEnter', () => {
	beforeEach( () => replaceBlocks.mockClear() );

	test.each( [
		[ 'confirms a composition (Chrome, Firefox)', { isComposing: true }, 0 ],
		[ 'follows compositionend with keyCode 229 (Safari)', { keyCode: 229 }, 0 ],
		[ 'is a plain Enter', {}, 1 ],
	] )( 'Enter on an empty option that %s splits the field %d time(s)', ( _, init, splits ) => {
		const element = document.createElement( 'div' );
		useEnter( { content: '', clientId: 'option', isStandalone: false } )( element );

		const event = new KeyboardEvent( 'keydown', {
			key: 'Enter',
			bubbles: true,
			cancelable: true,
			isComposing: !! init.isComposing,
		} );
		if ( init.keyCode ) {
			// KeyboardEventInit ignores keyCode.
			Object.defineProperty( event, 'keyCode', { get: () => init.keyCode } );
		}
		element.dispatchEvent( event );

		expect( replaceBlocks ).toHaveBeenCalledTimes( splits );
	} );
} );
