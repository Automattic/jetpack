/**
 * Internal dependencies
 */
import { settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

// this is necessary because block editor store becomes unregistered during jest initialization
import { register } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
register( blockEditorStore );

beforeEach( () => {
	Intl.NumberFormat = jest
		.fn()
		.mockImplementation( () => ( { format: value => `A$${ value.toString() }.00` } ) );
} );

afterEach( () => {
	jest.resetAllMocks();
} );

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [ { name: 'jetpack/simple-payments', settings } ];

runBlockFixtureTests( 'jetpack/simple-payments', blocks, __dirname );
