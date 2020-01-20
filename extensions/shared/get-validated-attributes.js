/**
 * External dependencies
 */
import { reduce } from 'lodash';

export const getValidatedAttributes = ( attributeDetails, attributesToValidate ) =>
	reduce(
		attributesToValidate,
		( ret, attribute, attributeKey ) => {
			const { type, validator, validValues, default: defaultVal } = attributeDetails[
				attributeKey
			];
			if ( 'boolean' === type ) {
				ret[ attributeKey ] = !! attribute;
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
