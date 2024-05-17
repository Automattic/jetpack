import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Supports and extensions
 */
import './supports';
import './extensions/ai-assistant';
import './extensions/jetpack-contact-form';
import './inline-extensions/with-ai-extension';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms,
} );
