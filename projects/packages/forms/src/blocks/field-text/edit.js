import JetpackField from '../contact-form/components/jetpack-field';
import { useFormWrapper } from '../contact-form/util/form';
import getFieldLabel from '../contact-form/util/get-field-label';

export default function FieldTextEdit( props ) {
	// When this block is inserted alone without a form wrapper,
	// useFormWrapper will insert one around it.
	useFormWrapper( props );

	// If the field label is empty, this replaces it with the block title.
	// TODO: Consider if this is a good idea.
	const label = getFieldLabel( props.attributes, props.name );

	return <JetpackField type="text" label={ label } { ...props } />;
}
