import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
} );
