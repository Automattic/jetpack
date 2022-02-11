/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import {
	name as loggedOutViewBlockName,
	settings as loggedOutViewBlockSettings,
} from './logged-out-view/.';
import {
	name as subscriberViewBlockName,
	settings as subscriberViewBlockSettings,
} from './subscriber-view/.';
import { name as buttonsBlockName, settings as buttonsBlockSettings } from './buttons/.';
import {
	name as loginButtonBlockName,
	settings as loginButtonBlockSettings,
} from './login-button/.';
import RemoveBlockKeepContent from './_inc/remove-block-keep-content';

const prefix = false;
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

registerPlugin( 'block-settings-remove-block-keep-content', {
	render: RemoveBlockKeepContent,
} );
