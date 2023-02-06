import { settings } from '../';
import { settings as contactInfoSettings } from '../../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [
	{ name: 'jetpack/address', settings },
	{ name: 'jetpack/contact-info', settings: contactInfoSettings },
];

runBlockFixtureTests( 'jetpack/address', blocks, __dirname );
