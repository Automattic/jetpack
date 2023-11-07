import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import deprecatedV2 from '../deprecated/v2';
import edit from '../edit';
import save from '../save';
import styles from '../styles';

const { name } = metadata;

const blocks = [
	{
		name,
		settings: {
			...metadata,
			edit,
			save,
			styles,
			deprecated: [ deprecatedV2, deprecatedV1 ],
		},
	},
];
runBlockFixtureTests( name, blocks, __dirname );
