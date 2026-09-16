/**
 * Entry point for the PayPal Payment Buttons block.
 *
 * Registers the block with `registerJetpackBlockFromMetadata` using
 * `save: () => null` — the frontend markup is rendered in PHP by
 * PayPal_Payment_Buttons::render_block().
 */
import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { registerJetpackBlockFromMetadata } from '../block/register-jetpack-block';
import metadata from './block.json';
import deprecated from './deprecated';
import edit, { API_MANAGED_BUTTONS_FLAG } from './edit';
import PayPalIcon from './icon';
import { registerSaveSync } from './utils/register-save-sync';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	icon: PayPalIcon,
	deprecated,
} );

// API-managed payments are created, updated and deleted with the post.
registerSaveSync( () => hasFeatureFlag( API_MANAGED_BUTTONS_FLAG ) );
