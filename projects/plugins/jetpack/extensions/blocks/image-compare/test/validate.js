import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import save from '../save';

const { name } = metadata;
const blocks = [
	{
		name,
		settings: {
			...metadata,
			save,
		},
	},
];

runBlockFixtureTests( name, blocks, __dirname );
