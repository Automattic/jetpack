/**
 * Local copy of getValidatedAttributes from the Jetpack plugin's shared utils.
 *
 * Coerces user-supplied block attributes against the metadata definition so a
 * persisted typo (string `"true"`, out-of-range enum value, etc.) doesn't crash
 * the editor.
 *
 * @param {object} attributeDetails     - Block attribute schema (from block.json).
 * @param {object} attributesToValidate - Stored attribute values.
 * @return {object} Validated attribute values.
 */
export const getValidatedAttributes = ( attributeDetails, attributesToValidate ) =>
	Object.entries( attributesToValidate ).reduce( ( ret, [ attributeKey, attribute ] ) => {
		if ( undefined === attributeDetails[ attributeKey ] ) {
			return ret;
		}
		const { type, validator, validValues, default: defaultVal } = attributeDetails[ attributeKey ];
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
	}, {} );
