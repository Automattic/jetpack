import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';

const { name } = metadata;
const blocks = [
	{ name, settings: metadata },
	{ name: `jetpack/button`, settings: buttonSettings },
];
runBlockFixtureTests( name, blocks, __dirname );
