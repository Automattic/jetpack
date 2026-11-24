import { registerPlugin } from '@wordpress/plugins';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { useSyncCookieConsentSettings } from './use-save-cookie-consent-settings';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	supports: {
		...metadata.supports,
		inserter: window.Jetpack_Editor_Initial_State?.screenBase === 'site-editor',
	},
} );
if ( window.Jetpack_Editor_Initial_State?.screenBase !== 'site-editor' ) {
	registerPlugin( 'jetpack-cookie-consent-settings', {
		render: function CookieConsentSettingsSync() {
			useSyncCookieConsentSettings();
			return null;
		},
	} );
}
