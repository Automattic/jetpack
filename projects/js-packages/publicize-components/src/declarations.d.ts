import { SocialPluginSettings, SocialSettingsFields } from './social-store/types';
import { SocialScriptData } from './types';

// Use module augmentation to add the social property to JetpackInitialState
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		social: SocialScriptData;
	}
}

declare module '@wordpress/core-data' {
	export interface PerPackageEntityRecords {
		'jetpack/v4': SocialPluginSettings;
	}
	export interface PerPackageEntityRecords {
		root: SocialSettingsFields;
	}

	export namespace BaseEntityRecords {
		export interface Settings extends SocialSettingsFields {}
	}
}
