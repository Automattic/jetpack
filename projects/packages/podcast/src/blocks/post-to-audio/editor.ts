import { registerJetpackBlockFromMetadata } from '../podcast-episode/util/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
} );
