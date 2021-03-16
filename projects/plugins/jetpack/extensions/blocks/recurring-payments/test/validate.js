/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { settings as buttonSettings } from '../../button';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

const blocks = [
    { name: `jetpack/${ name }`, settings },
    { name: `jetpack/button`, settings: buttonSettings },
];

runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
