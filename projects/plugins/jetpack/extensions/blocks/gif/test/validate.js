import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import edit from '../edit';

const { name } = metadata;
const blocks = [ { name, settings: { ...metadata, edit } } ];

runBlockFixtureTests( name, blocks, __dirname );
