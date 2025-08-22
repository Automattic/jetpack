import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes } = props;
	useFormWrapper( props );

	const handleLabelChange = textValue => {
		setAttributes( { label: textValue } );
	};

	const handleValueChange = textValue => {
		setAttributes( { default: textValue } );
	};

	return (
		<Placeholder
			icon={ unseen }
			label={ __( 'Hidden Field', 'jetpack-forms' ) }
			isColumnLayout={ true }
		>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				onChange={ handleLabelChange }
				placeholder={ __( 'Hidden input field', 'jetpack-forms' ) }
				value={ attributes.label }
				label={ __( 'Field Label', 'jetpack-forms' ) }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				onChange={ handleValueChange }
				placeholder={ __( 'Field value', 'jetpack-forms' ) }
				value={ attributes.default }
				label={ __( 'Field value', 'jetpack-forms' ) }
			/>
		</Placeholder>
	);
}
