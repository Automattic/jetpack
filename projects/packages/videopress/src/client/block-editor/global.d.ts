/**
 * Internal dependencies
 */
import { VideoPressExtensionsProps } from './extensions/types';
declare global {
	interface Window {
		videoPressEditorState: {
			extensions: VideoPressExtensionsProps;
			siteType: 'simple' | 'atomic' | 'jetpack';
			myJetpackConnectUrl: string;
			isVideoPressModuleActive: '' | '1';
			isStandaloneActive: '' | '1';
			// Feature gate mirrored from `Admin_UI::is_chapters_editor_enabled()`.
			// `wp_localize_script()` stringifies scalars, so a PHP bool arrives as
			// '' | '1'; the boolean form is allowed for a future JSON channel.
			// Optional so payloads from a build predating the gate still typecheck.
			chaptersEditorEnabled?: boolean | '' | '1';
			jetpackVideoPressSettingUrl: string;
			imagesURLBase: string;
			playerBridgeUrl: string;
			webpackPublicPath: string;
		};
	}
}
