import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
} );
