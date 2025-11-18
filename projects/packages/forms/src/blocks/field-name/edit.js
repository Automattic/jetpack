import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useNameLabelSync from './hooks/use-name-label-sync.js';

export default function NameFieldEdit( props ) {
	useFormWrapper( props );

	useNameLabelSync( { clientId: props.clientId, id: props.attributes?.id } );

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
