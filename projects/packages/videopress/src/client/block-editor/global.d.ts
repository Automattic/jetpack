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
			jetpackVideoPressSettingUrl: string;
			imagesURLBase: string;
			playerBridgeUrl: string;
		};
	}
}
