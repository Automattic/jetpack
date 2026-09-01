/**
 * Entry point for the PayPal Payment Buttons block.
 *
 * Registers the block with `registerJetpackBlockFromMetadata` using
 * `save: () => null` — the frontend markup is rendered in PHP by
 * PayPal_Payment_Buttons::render_block().
 */
import { registerJetpackBlockFromMetadata } from '../block/register-jetpack-block';
import metadata from './block.json';
import deprecated from './deprecated';
import edit from './edit';
import PayPalIcon from './icon';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	icon: PayPalIcon,
	deprecated,
} );
