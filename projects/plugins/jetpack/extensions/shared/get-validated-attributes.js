import { reduce } from 'lodash';

/**
 * Take user set attributes and validate them against the attribute definition.
 *
 * @param {string} attributeDetails An object representing the attributes for a block, formatted as an object with these properties: type, default, validator.
 * @param {string} attributesToValidate The attributes for an instance of the block, which may have been edited by a user
 * @returns {object} Block attributes that have been validated.
 */
export const getValidatedAttributes = ( attributeDetails, attributesToValidate ) =>
	reduce(
		attributesToValidate,
		( ret, attribute, attributeKey ) => {
			if ( undefined === attributeDetails[ attributeKey ] ) {
				return ret;
			}
			const { type, validator, validValues, default: defaultVal } = attributeDetails[
				attributeKey
			];
			if ( 'boolean' === type ) {
				ret[ attributeKey ] = attribute === 'false' ? false : !! attribute;
			} else if ( validator ) {
				ret[ attributeKey ] = validator( attribute ) ? attribute : defaultVal;
			} else if ( validValues ) {
				ret[ attributeKey ] = validValues.includes( attribute ) ? attribute : defaultVal;
			} else {
				ret[ attributeKey ] = attribute;
			}
			return ret;
		},
		{}
	);
