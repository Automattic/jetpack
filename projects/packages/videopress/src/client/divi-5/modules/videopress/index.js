/**
 * Divi 5 VideoPress module definition.
 */
import { conversionOutline } from './conversion-outline';
import { VideoPressEdit } from './edit';
import metadata from './module.json';
import { SettingsAdvanced } from './settings-advanced';
import { SettingsContent } from './settings-content';
import { SettingsDesign } from './settings-design';

export const videoPressMetadata = metadata;

export const videoPressModule = {
	renderers: {
		edit: VideoPressEdit,
	},
	settings: {
		content: SettingsContent,
		design: SettingsDesign,
		advanced: SettingsAdvanced,
	},
	conversionOutline,
};
