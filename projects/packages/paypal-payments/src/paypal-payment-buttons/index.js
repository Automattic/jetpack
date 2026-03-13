/**
 * PayPal Payment Buttons — Block Registration.
 *
 * Registers the block with WordPress, wiring together the edit component,
 * save component, and deprecation handlers. This is the entry point
 * specified in block.json's `editorScript`.
 *
 * @package
 * @since 0.8.0
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block-v2.json';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

/**
 * Register the PayPal Payment Buttons block.
 *
 * The `deprecated` array ensures existing paste-code blocks from
 * v0.4.0-alpha are recognized and migrated without "unexpected content"
 * errors in the editor.
 */
registerBlockType( metadata.name, {
	...metadata,
	edit,
	save,
	deprecated,
} );
