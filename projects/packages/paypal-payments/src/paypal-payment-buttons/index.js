/**
 * Standalone plugin entry point for PayPal Payment Buttons.
 *
 * This file is used when the block runs as a standalone WordPress plugin
 * (outside the Jetpack monorepo). It uses `registerBlockType` with a static
 * save component, deprecated handler, and block-v2.json as the manifest.
 *
 * For the Jetpack monorepo entry point, see editor.js (uses block.json
 * with dynamic/PHP rendering via `save: () => null`).
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
