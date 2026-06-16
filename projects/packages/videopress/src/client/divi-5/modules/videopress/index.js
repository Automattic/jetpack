/**
 * Divi 5 VideoPress module definition.
 */
// Single source of truth: the Divi 5 Migrator scans for this JSON next to
// module.json to mark the legacy `divi_videopress` shortcode as convertible,
// and the Visual Builder uses the same data for in-builder conversion.
import conversionOutline from './conversion-outline.json';
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
