/**
 * Jetpack monorepo entry point for PayPal Payment Buttons.
 *
 * This file is used when the block runs inside the Jetpack plugin in the
 * monorepo. It uses `registerJetpackBlockFromMetadata` with `save: () => null`
 * (dynamic/PHP rendering) and block.json as the manifest.
 *
 * For the standalone plugin entry point, see index.js (uses block-v2.json
 * with a static save component and deprecated handler).
 */
import { registerJetpackBlockFromMetadata } from '../block/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import PayPalIcon from './icon';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	icon: PayPalIcon,
} );
