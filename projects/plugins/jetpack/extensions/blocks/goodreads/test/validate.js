import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

const blocks = [ { name: `jetpack/${ name }`, settings } ];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
