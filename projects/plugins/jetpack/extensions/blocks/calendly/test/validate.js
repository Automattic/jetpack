/**
 * Internal dependencies
 */
import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { name, settings } from '../';
import { settings as buttonSettings } from '../../button';

const primaryBlock = { name: `jetpack/${ name }`, settings };
const innerBlocks = [
	{ name: 'jetpack/button', settings: buttonSettings },
];

runBlockFixtureTests( `jetpack/${ name }`, [ primaryBlock, ...innerBlocks ], __dirname );
