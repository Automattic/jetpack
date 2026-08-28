import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field.jsx';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';

/**
 * Editor component for the jetpack/field-text block.
 *
 * The conditional-logic panel is not wired up here: an `editor.BlockEdit` filter adds it to
 * every `jetpack/field-*` block, this one included.
 *
 * @param {object} props - Block editor props passed in by Gutenberg.
 * @return {object} The text field editor markup.
 */
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
