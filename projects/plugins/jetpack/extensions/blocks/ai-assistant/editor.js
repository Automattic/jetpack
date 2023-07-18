import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings, pluginSettings } from '.';

registerJetpackBlock( name, settings );
registerJetpackPlugin( name, pluginSettings );
