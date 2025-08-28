import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import { iconString } from './icon';
import save from './save';

registerJetpackBlockFromMetadata(
	{
		...metadata,
		icon: iconString,
	},
	{
		edit,
		save,
		supports: metadata.supports,
	}
);
