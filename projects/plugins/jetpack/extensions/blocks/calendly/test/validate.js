import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';

const { name } = metadata;
const primaryBlock = { name, settings: metadata };
const innerBlocks = [ { name: 'jetpack/button', settings: buttonSettings } ];
const blocks = [ primaryBlock, ...innerBlocks ];

runBlockFixtureTests( name, blocks, __dirname );
