/**
 * Internal dependencies
 */
import attributes from './attributes';
import save from './save';

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
