/**
 * Divi 5 VideoPress module definition.
 */
// Single source of truth: the Divi 5 Migrator scans for this JSON next to
// module.json to mark the legacy `divi_videopress` shortcode as convertible,
// and the Visual Builder uses the same data for in-builder conversion.
import conversionOutline from './conversion-outline.json';
import { VideoPressEdit } from './edit';
import defaultRenderAttributes from './module-default-render-attributes.json';
import metadata from './module.json';

export const videoPressMetadata = metadata;

/*
 * The settings panels are generated automatically by Divi from the field and
 * group declarations in module.json (`settings: { content/design/advanced: "auto" }`),
 * so no custom panel components are registered here. `defaultAttrs` seeds the
 * builder's initial attribute values (e.g. controls on).
 */
export const videoPressModule = {
	renderers: {
		edit: VideoPressEdit,
	},
	defaultAttrs: defaultRenderAttributes,
	conversionOutline,
};
