/**
 * Merge the settings (or metadata) of two blocks. The settings of the second parameter
 * take precedence over the first parameter. In the case of the `supports` and `attributes`
 * keys, a new object is created with the merged values.
 *
 * See https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/
 *
 * @param {object} defaultSettings - Default block settings
 * @param {object} settings        - Block settings
 * @return {object} Merged settings
 */
export default function mergeSettings( defaultSettings, settings ) {
	return {
		...defaultSettings,
		...settings,
		supports: {
			...defaultSettings.supports,
			...settings.supports,
		},
		attributes: {
			...defaultSettings.attributes,
			...settings.attributes,
		},
	};
}
