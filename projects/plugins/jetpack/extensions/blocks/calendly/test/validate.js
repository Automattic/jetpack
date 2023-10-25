import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import save from '../save';

const { name } = metadata;
const primaryBlock = {
	name,
	settings: {
		...metadata,
		save,
		deprecated: [ deprecatedV1 ],
	},
};
const innerBlocks = [ { name: 'jetpack/button', settings: buttonSettings } ];
const blocks = [ primaryBlock, ...innerBlocks ];

runBlockFixtureTests( name, blocks, __dirname );
