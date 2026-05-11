import metadata from './block.json';
import edit from './edit';
import save from './save';
import { registerJetpackBlockFromMetadata } from './util/register-jetpack-block';

import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
} );
