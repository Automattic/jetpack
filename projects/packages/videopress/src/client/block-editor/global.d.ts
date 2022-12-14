/**
 * Internal dependencies
 */
import { VideoPressExtensionsProps } from './extensions/types';
declare global {
	interface Window {
		videoPressEditorState: {
			extensions: VideoPressExtensionsProps;
			siteType: 'simple' | 'atomic' | 'jetpack';
		};
	}
}
