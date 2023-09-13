import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
} );
