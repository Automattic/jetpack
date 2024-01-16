import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import {
	name as whatsAppButtonBlockName,
	settings as whatsAppButtonBlockSettings,
} from './whatsapp-button';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save,
		variations,
	},
	[
		{
			name: whatsAppButtonBlockName,
			settings: whatsAppButtonBlockSettings,
		},
	]
);
