import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	useFormWrapper( props );
	const blockProps = useBlockProps();

	const handleLabelChange = textValue => {
		setAttributes( { label: textValue } );
	};

	const handleValueChange = textValue => {
		setAttributes( { default: textValue } );
	};
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId, true );

	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ unseen }
				label={ __( 'Hidden Field', 'jetpack-forms' ) }
				isColumnLayout={ true }
			>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					onChange={ handleLabelChange }
					label={ __( 'Field Label', 'jetpack-forms' ) }
					hideLabelFromVision={ true }
					placeholder={ __( 'Field Label', 'jetpack-forms' ) }
					value={ attributes.label }
					help={ attributes.label ? __( 'Field Label', 'jetpack-forms' ) : '' }
				/>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					onChange={ handleValueChange }
					label={ __( 'Field Value', 'jetpack-forms' ) }
					hideLabelFromVision={ true }
					placeholder={ __( 'Field value', 'jetpack-forms' ) }
					value={ attributes.default }
					help={ attributes.default ? __( 'Field value', 'jetpack-forms' ) : '' }
					onKeyDown={ onKeyDown }
				/>
			</Placeholder>
		</div>
	);
}
