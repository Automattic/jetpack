/**
 * WordPress dependencies
 */
import { registerBlockType, setCategories } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings } from '../';
import { settings as parentSettings } from '../../';
import runBlockFixtureTests from '../../../../shared/test/block-fixtures';

// Need to add a valid category or block registration fails
setCategories( [
	{
		slug: 'test',
		title: 'Test',
	},
] );

registerBlockType( 'jetpack/whatsapp-button', { ...settings, category: 'test' } );
registerBlockType( 'jetpack/send-a-message', { ...parentSettings, category: 'test' } );
runBlockFixtureTests( 'jetpack/whatsapp-button', settings, __dirname );
