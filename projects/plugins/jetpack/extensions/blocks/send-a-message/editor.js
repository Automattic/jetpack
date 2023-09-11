import registerJetpackBlock from '../../shared/register-jetpack-block';
import {
	name as whatsAppButtonBlockName,
	settings as whatsAppButtonBlockSettings,
} from './whatsapp-button';
import { name, settings } from '.';

registerJetpackBlock( name, settings, [
	{
		name: whatsAppButtonBlockName,
		settings: whatsAppButtonBlockSettings,
	},
] );
