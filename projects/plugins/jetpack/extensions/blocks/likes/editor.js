/**
 * Internal dependencies
 */
import { blockSettings, name, pluginSettings } from '.';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import registerJetpackPlugin from '../../shared/register-jetpack-plugin';

registerJetpackBlock( name, blockSettings );
registerJetpackPlugin( name, pluginSettings );
