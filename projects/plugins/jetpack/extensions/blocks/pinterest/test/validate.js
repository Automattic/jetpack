import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import edit from '../edit';
import save from '../save';

const { name } = metadata;
const blocks = [
	{
		name,
		settings: {
			...metadata,
			edit,
			save,
			deprecated: [ deprecatedV1 ],
		},
	},
];

runBlockFixtureTests( name, blocks, __dirname );
