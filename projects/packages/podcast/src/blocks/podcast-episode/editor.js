import metadata from './block.json';
import edit from './edit.js';
import save from './save.js';
import { registerJetpackBlockFromMetadata } from './util/register-jetpack-block.js';

import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
} );
