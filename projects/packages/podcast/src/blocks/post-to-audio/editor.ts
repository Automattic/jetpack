import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';

// Register directly with `registerBlockType` (like the other jetpack-mu-wpcom
// inserter blocks, e.g. timeline / event-countdown). The block is already gated
// server-side by `Podcast::is_post_to_audio_enabled()`, so the Jetpack
// extension-availability gate that `registerJetpackBlockFromMetadata` enforces
// is both redundant and unsatisfied here (the extension is never added to
// `Jetpack_Gutenberg`'s known-extensions list), which kept the block out of the
// inserter.
registerBlockType( metadata.name, {
	...metadata,
	edit,
	save,
	icon: getBlockIconProp( metadata ),
	attributes: metadata.attributes || {},
} );
