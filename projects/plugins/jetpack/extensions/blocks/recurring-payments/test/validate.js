import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';

const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{ name: `jetpack/button`, settings: buttonSettings },
];

runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
