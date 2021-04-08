/**
 * Internal dependencies
 */
import { settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

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
