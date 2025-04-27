import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Extensions
 */
import './extensions/text-blocks/with-ai-text-extension';
import './extensions/image/with-ai-image-extension';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms,
} );
