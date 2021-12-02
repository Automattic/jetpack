/**
 * Internal dependencies
 */
import { name, settings } from './publicize';
import registerJetpackPlugin from './shared/register-jetpack-plugin';

console.log('here');
/**
 * Add Publicize functionality
 */
 registerJetpackPlugin( name, settings );
