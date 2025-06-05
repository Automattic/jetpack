import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function UrlFieldEdit( props ) {
	useFormWrapper( props );

	return (
		<JetpackField
			clientId={ props.clientId }
			type="url"
			label={ __( 'Website', 'jetpack-forms' ) }
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
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
