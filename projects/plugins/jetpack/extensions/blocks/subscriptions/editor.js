import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings, pluginSettings } from '.';

// Registers Subscribe block.
registerJetpackBlock( name, settings );

// Registers slot/fill panels defined via settings.render.
registerJetpackPlugin( name, pluginSettings );
