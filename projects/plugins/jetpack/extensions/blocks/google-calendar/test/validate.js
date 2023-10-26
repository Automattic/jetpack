import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import edit from '../edit';
import save from '../save';

const { name } = metadata;
const blocks = [ { name, settings: { ...metadata, save, edit } } ];

runBlockFixtureTests( name, blocks, __dirname );
