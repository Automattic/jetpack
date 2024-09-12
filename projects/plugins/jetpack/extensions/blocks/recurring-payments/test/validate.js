import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import deprecatedV2 from '../deprecated/v2';
import edit from '../edit';
import save from '../save';

const { name } = metadata;
const blocks = [
	{ name, settings: { ...metadata, edit, save, deprecated: [ deprecatedV2, deprecatedV1 ] } },
	{ name: `jetpack/button`, settings: buttonSettings },
];

runBlockFixtureTests( name, blocks, __dirname );
