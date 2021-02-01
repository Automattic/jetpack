/**
 * WordPress dependencies
 */
import { registerBlockType, setCategories, getCategories } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings } from '../';
import { settings as parentSettings } from '../../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';

setCategories( [
	...getCategories().filter( ( { slug } ) => slug !== 'test' ),
	// Add a Test block category
	{
		slug: 'test',
		title: 'Test',
	},
] );

registerBlockType( 'jetpack/whatsapp-button', { ...settings, category: 'test' } );
registerBlockType( 'jetpack/send-a-message', { ...parentSettings, category: 'test' } );
runBlockFixtureTests( 'jetpack/whatsapp-button', settings, __dirname );
