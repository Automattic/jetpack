import { settings } from '../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';
import parentBlockMetadata from '../../block.json';

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [
	{ name: 'jetpack/email', settings },
	{ name: parentBlockMetadata.name, settings: parentBlockMetadata },
];

runBlockFixtureTests( 'jetpack/email', blocks, __dirname );
