import definedAttributes from './attributes';
import save from './save';

/**
 * Deprecation reason
 *
 * Added new block attribute `successMessage`, which was already available to the shortcode.
 */
export default {
	attributes: definedAttributes,
	save,
};
