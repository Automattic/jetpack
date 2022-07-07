/**
 * Internal dependencies
 */
import save from './save';
import attributes from './attributes';

/**
 * Deprecation reason
 *
 * Adding wrapper div so that saved block class styles are not
 * overriden by user added styles (via Block settings, e.g. extra padding)
 */
export default {
	attributes,
	save,
};
