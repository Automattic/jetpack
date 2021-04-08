/**
 * Internal dependencies
 */
import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

// The Eventbrite block uses the Button block in Innerblocks so we have to import the button block type definitions.
import { settings as buttonSettings } from '../../button';

const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{ name: 'jetpack/button', settings: buttonSettings },
];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
