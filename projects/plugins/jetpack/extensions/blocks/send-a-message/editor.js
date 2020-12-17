/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import {
	name as whatsAppButtonBlockName,
	settings as whatsAppButtonBlockSettings,
} from './whatsapp-button';

registerJetpackBlock( name, settings, [
	{
		name: whatsAppButtonBlockName,
		settings: whatsAppButtonBlockSettings,
	},
] );
