import { settings } from '../';
import { settings as parentSettings } from '../../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [
	{ name: 'jetpack/whatsapp-button', settings },
	{ name: 'jetpack/send-a-message', settings: parentSettings },
];

runBlockFixtureTests( 'jetpack/whatsapp-button', blocks, __dirname );
