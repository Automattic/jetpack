import { name, settings } from '../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';
import parentMetadata from '../../block.json';
import save from '../../save';

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{
		name: parentMetadata.name,
		settings: {
			...parentMetadata,
			save,
		},
	},
];

runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
