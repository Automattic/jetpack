import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, TextControl, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import JetpackFieldId from '../shared/components/jetpack-field-id-control.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down.js';
import './editor.scss';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const blockProps = useBlockProps();
	useFormWrapper( props );

	const handleLabelChange = textValue => {
		setAttributes( { label: textValue } );
	};

	const handleValueChange = textValue => {
		setAttributes( { default: textValue } );
	};

	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId, true );

	return (
		<>
			<div { ...blockProps }>
				<Placeholder icon={ unseen } label={ __( 'Hidden field', 'jetpack-forms' ) }>
					<HStack alignment="top" className="jetpack-form-hidden-field-inputs">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							onChange={ handleLabelChange }
							label={ __( 'Name', 'jetpack-forms' ) }
							value={ attributes.label }
							help={ __(
								'Internal name used to identify this field in form responses.',
								'jetpack-forms'
							) }
							onKeyDown={ onKeyDown }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							onChange={ handleValueChange }
							label={ __( 'Value', 'jetpack-forms' ) }
							value={ attributes.default }
							help={ __( 'The value that will be submitted with the form.', 'jetpack-forms' ) }
							onKeyDown={ onKeyDown }
						/>
					</HStack>
				</Placeholder>
			</div>
			<JetpackFieldId id={ attributes.id } setAttributes={ setAttributes } />
		</>
	);
}
