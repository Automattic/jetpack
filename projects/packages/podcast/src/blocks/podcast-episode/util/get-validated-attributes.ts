/**
 * Local copy of getValidatedAttributes from the Jetpack plugin's shared utils.
 *
 * Coerces user-supplied block attributes against the metadata definition so a
 * persisted typo (string `"true"`, out-of-range enum value, etc.) doesn't crash
 * the editor.
 */

interface AttributeSchema {
	type?: string | string[];
	default?: unknown;
	enum?: unknown[];
	validValues?: unknown[];
	validator?: ( value: unknown ) => boolean;
	[ key: string ]: unknown;
}

type AttributeDetails = Record< string, AttributeSchema >;
type AttributesToValidate = Record< string, unknown >;

export const getValidatedAttributes = (
	attributeDetails: AttributeDetails,
	attributesToValidate: AttributesToValidate
): Record< string, unknown > =>
	Object.entries( attributesToValidate ).reduce< Record< string, unknown > >(
		( ret, [ attributeKey, attribute ] ) => {
			if ( undefined === attributeDetails[ attributeKey ] ) {
				return ret;
			}
			const {
				type,
				validator,
				validValues,
				default: defaultVal,
			} = attributeDetails[ attributeKey ];
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
