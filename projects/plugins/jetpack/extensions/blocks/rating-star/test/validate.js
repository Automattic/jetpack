import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import edit from '../edit';
import { StarIcon } from '../icon';
import save from '../save';

const { name } = metadata;
const blocks = [
	{
		name,
		settings: {
			...metadata,
			edit: edit( StarIcon ),
			save: save( '★' ), // Fallback symbol if the block is removed or the render_callback deactivated.
		},
	},
];

runBlockFixtureTests( name, blocks, __dirname );
