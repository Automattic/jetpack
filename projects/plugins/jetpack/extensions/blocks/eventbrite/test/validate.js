import { store as blockEditorStore } from '@wordpress/block-editor';
import { register } from '@wordpress/data';
import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';
// The Eventbrite block uses the Button block in Innerblocks so we have to import the button block type definitions.
import { settings as buttonSettings } from '../../button';

// this is necessary because block editor store becomes unregistered during jest initialization
register( blockEditorStore );

const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{ name: 'jetpack/button', settings: buttonSettings },
];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
