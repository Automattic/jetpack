/**
 * Internal dependencies
 */
import { VideoPressExtensionsProps } from './types';

declare global {
	interface Window {
		videoPressEditorState: {
			extensions: VideoPressExtensionsProps;
			siteType: 'simple' | 'atomic' | 'jetpack';
		};
	}
}
