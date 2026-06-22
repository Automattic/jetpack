import metadata from './block.json';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';
import { registerJetpackBlockFromMetadata } from './util/register-jetpack-block';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	deprecated,
} );
