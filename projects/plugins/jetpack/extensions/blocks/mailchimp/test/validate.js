import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';
import deprecated from '../deprecated/v1';
import edit from '../edit';
import save from '../save';

const { name } = metadata;
const blocks = [
	{ name, settings: { ...metadata, edit, save, deprecated: [ deprecated ] } },
	{ name: `jetpack/button`, settings: buttonSettings },
];

runBlockFixtureTests( name, blocks, __dirname );
