import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, pluginSettings } from '.';

// Registers slot/fill panels defined via settings.render.
registerJetpackPlugin( name, pluginSettings );
