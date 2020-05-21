/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import {
	name as whatsAppBlockName,
	settings as whatsAppBlockSettings,
} from './service-blocks/whatsapp';

registerJetpackBlock( name, settings, [
	{
		name: whatsAppBlockName,
		settings: whatsAppBlockSettings,
	},
] );
