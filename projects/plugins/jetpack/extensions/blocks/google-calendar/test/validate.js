import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';

const blocks = [ { name, settings: metadata } ];

runBlockFixtureTests( name, blocks, __dirname );
