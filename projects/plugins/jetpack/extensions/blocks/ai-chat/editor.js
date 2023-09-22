import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';
import './components/feedback/style.scss';

registerJetpackBlockFromMetadata( metadata, {
	// The API version needs to be explicitly specified in this instance for styles to be loaded.
	apiVersion: metadata.apiVersion,
	edit,
	save,
} );
