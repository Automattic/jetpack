import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save'; // TODO: Replace
import transforms from './transforms';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: transforms( metadata.name ),
} );
