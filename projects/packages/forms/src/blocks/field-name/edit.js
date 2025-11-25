import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useNameFieldTransforms from './hooks/use-name-field-transforms.js';
import {
	isFirstNameVariationId,
	isLastNameVariationId,
	isNameVariationId,
	FIRST_NAME_ID,
	LAST_NAME_ID,
	NAME_ID,
} from './variations.js';

export default function NameFieldEdit( props ) {
	const { clientId, attributes, setAttributes } = props;
	const { id, fieldVariant } = attributes || {};

	useFormWrapper( props );

	// Initialize fieldVariant for backward compatibility with existing Name field blocks.
	useEffect( () => {
		if ( fieldVariant ) {
			return;
		}
		if ( isFirstNameVariationId( id ) ) {
			setAttributes( { fieldVariant: FIRST_NAME_ID } );
		} else if ( isLastNameVariationId( id ) ) {
			setAttributes( { fieldVariant: LAST_NAME_ID } );
		} else if ( isNameVariationId( id ) ) {
			setAttributes( { fieldVariant: NAME_ID } );
		} else {
			// Default to base 'name' variant for any other case (empty id or 'name' id)
			setAttributes( { fieldVariant: '' } );
		}
	}, [ clientId, fieldVariant, id, setAttributes ] );

	// Update HTML IDs and labels when transforming between variations.
	useNameFieldTransforms( { clientId, fieldVariant } );

	return (
		<JetpackField
			clientId={ props.clientId }
			type="text"
			label={ __( 'Name', 'jetpack-forms' ) }
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
			requiredIndicator={ props.attributes.requiredIndicator }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			placeholder={ props.attributes.placeholder }
			id={ props.attributes.id }
			width={ props.attributes.width }
			attributes={ props.attributes }
			insertBlocksAfter={ props.insertBlocksAfter }
		/>
	);
}
