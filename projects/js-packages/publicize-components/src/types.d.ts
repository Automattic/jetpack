import { SocialScriptData } from './types/types';

// Use module augmentation to add the social property to JetpackInitialState
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		social: SocialScriptData;
	}
}
