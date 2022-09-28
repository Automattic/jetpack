import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { registerPlugin } from '@wordpress/plugins';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import RemoveBlockKeepContent from './_inc/remove-block-keep-content';
import { name as buttonsBlockName, settings as buttonsBlockSettings } from './buttons/.';
import {
	name as loggedOutViewBlockName,
	settings as loggedOutViewBlockSettings,
} from './logged-out-view/.';
import {
	name as loginButtonBlockName,
	settings as loginButtonBlockSettings,
} from './login-button/.';
import {
	name as subscriberViewBlockName,
	settings as subscriberViewBlockSettings,
} from './subscriber-view/.';
import { name, settings } from '.';

const prefix = false;
if ( isSimpleSite() || isAtomicSite() ) {
	registerJetpackBlock(
		name,
		settings,
		[
			{ name: loggedOutViewBlockName, settings: loggedOutViewBlockSettings },
			{ name: subscriberViewBlockName, settings: subscriberViewBlockSettings },
			{ name: buttonsBlockName, settings: buttonsBlockSettings },
			{ name: loginButtonBlockName, settings: loginButtonBlockSettings },
		],
		prefix
	);
}

registerPlugin( 'block-settings-remove-block-keep-content', {
	render: RemoveBlockKeepContent,
} );
