import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Extensions
 */
import './extensions/with-ai-extension';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms,
} );
