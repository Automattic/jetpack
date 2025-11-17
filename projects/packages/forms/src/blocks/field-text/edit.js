import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';

export default function TextFieldEdit( props ) {
	useFormWrapper( props );

	return (
		<JetpackField
			clientId={ props.clientId }
			type="text"
			label={ __( 'Text', 'jetpack-forms' ) }
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
