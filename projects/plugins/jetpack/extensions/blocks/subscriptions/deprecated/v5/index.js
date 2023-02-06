import definedAttributes from '../v3/attributes';
import save from './save';

/**
 * Deprecation reason
 *
 * Gutenberg's font size selector changed to use values including CSS units.
 * This changed the resulting values in the generated shortcode.
 */
export default {
	attributes: definedAttributes,
	migrate: attributes => {
		const { fontSize, customFontSize } = attributes;
		return {
			...attributes,
			fontSize: fontSize ? `${ fontSize }px` : undefined,
			customFontSize: customFontSize ? `${ customFontSize }px` : undefined,
		};
	},
	save,
};
