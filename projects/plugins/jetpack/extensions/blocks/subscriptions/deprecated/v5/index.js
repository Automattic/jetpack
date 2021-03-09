/**
 * Internal dependencies
 */
import definedAttributes from '../v3/attributes';
import save from './save';

export default {
	attributes: definedAttributes,
	migrate: attributes => {
		return {
			...attributes,
			fontSize: `${ attributes.fontSize }px`,
			customFontSize: `${ attributes.customFontSize }px`,
		};
	},
	save,
};
