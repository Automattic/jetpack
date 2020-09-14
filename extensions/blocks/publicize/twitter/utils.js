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

/**
 * Checks whether or not there are any tags in the content attributes for this particular block.
 *
 * @param {object} props - The block props.
 * @param {Array} tags - An array of the tag names to look for.
 * @returns {boolean} Whether or not any of the given tags were found.
 */
export const checkForTagsInContentAttributes = ( props, tags ) => {
	if ( 0 === tags.length ) {
		return false;
	}

	if ( ! SUPPORTED_BLOCKS[ props.name ]?.contentAttributes ) {
		return false;
	}

	const tagRegexp = new RegExp( `<(${ tags.join( '|' ) })( |>|/>)`, 'gi' );
	return SUPPORTED_BLOCKS[ props.name ].contentAttributes.reduce( ( found, attribute ) => {
		if ( found ) {
			return true;
		}

		return tagRegexp.test( props.attributes[ attribute ] );
	}, false );
};
