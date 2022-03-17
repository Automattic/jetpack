/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import { name as buttonsBlockName, settings as buttonsBlockSettings } from './button';

registerJetpackBlock( name, settings, [
	{ name: buttonsBlockName, settings: buttonsBlockSettings },
] );
