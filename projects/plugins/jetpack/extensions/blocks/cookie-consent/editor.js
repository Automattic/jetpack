import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import CookieConsentPreview from './preview';
import save from './save';

import './editor.scss';

const isSiteEditor = window.Jetpack_Editor_Initial_State?.screenBase === 'site-editor';

registerJetpackBlockFromMetadata( metadata, {
	edit: isSiteEditor ? edit : CookieConsentPreview,
	save,
	supports: {
		...metadata.supports,
		inserter: isSiteEditor,
	},
} );
