import { store as blockEditorStore } from '@wordpress/block-editor';
import { register } from '@wordpress/data';
import { settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

// this is necessary because block editor store becomes unregistered during jest initialization
register( blockEditorStore );

const intlNumberFormatSpy = jest.spyOn( Intl, 'NumberFormat' );
beforeEach( () => {
	intlNumberFormatSpy
		.mockReset()
		.mockImplementation( () => ( { format: value => `A$${ value.toString() }.00` } ) );
} );

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [ { name: 'jetpack/simple-payments', settings } ];

runBlockFixtureTests( 'jetpack/simple-payments', blocks, __dirname );
