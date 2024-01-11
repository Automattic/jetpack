import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';
import deprecated from '../deprecated';
import edit from '../edit';
import save from '../save';

const { name } = metadata;
const blocks = [
	{ name, settings: { ...metadata, save, edit, deprecated } },
	{ name: 'jetpack/button', settings: buttonSettings },
];

runBlockFixtureTests( name, blocks, __dirname );
