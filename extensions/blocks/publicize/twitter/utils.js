/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import { SUPPORTED_BLOCKS } from './index';

/**
 * Checks whether or not the content attributes have changed, given the prevProps, and props.
 *
 * @param {object} prevProps - The previous props.
 * @param {object} props - The current props.
 * @returns {boolean} Whether or not the content attributes in this block have changed.
 */
export const contentAttributesChanged = ( prevProps, props ) => {
	if ( ! SUPPORTED_BLOCKS[ props.name ] ) {
		return false;
	}

	const attributeNames = SUPPORTED_BLOCKS[ props.name ].contentAttributes;
	return ! isEqual(
		attributeNames.map( attribute => ( {
			attribute,
			content: prevProps.attributes[ attribute ],
		} ) ),
		attributeNames.map( attribute => ( { attribute, content: props.attributes[ attribute ] } ) )
	);
};
