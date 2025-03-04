import JetpackField from '../contact-form/components/jetpack-field';
import { useFormWrapper } from '../contact-form/util/form';
import useFieldId from './use-field-id';

export default function FieldTextEdit( props ) {
	useFieldId( props.setAttributes, props.attributes );

	// When this block is inserted alone without a form wrapper,
	// useFormWrapper will insert one around it.
	useFormWrapper( props );

	return <JetpackField type="text" label={ props.attributes.label } { ...props } />;
}
