import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import deprecated from '../deprecated';
import edit from '../edit';

const { name } = metadata;
const blocks = [
	{
		name,
		settings: {
			...metadata,
			edit,
			deprecated,
		},
	},
];

jest.mock( '@wordpress/notices', () => {}, { virtual: true } );

runBlockFixtureTests( name, blocks, __dirname );
