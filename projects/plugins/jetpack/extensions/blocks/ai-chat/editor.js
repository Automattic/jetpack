import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';
import './components/feedback/style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
} );
