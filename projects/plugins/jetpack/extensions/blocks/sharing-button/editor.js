import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	variations,
} );
