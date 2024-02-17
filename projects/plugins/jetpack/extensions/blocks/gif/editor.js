import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

// Ordering is important! Editor overrides style!
import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
} );
