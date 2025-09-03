import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;

	const icon = unseen;
	const label = __( 'Hidden Field', 'jetpack-forms' );
	const fieldNameLabel = __( 'Field Name', 'jetpack-forms' );
	const valueLabel = __( 'Field Value', 'jetpack-forms' );

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
			<Placeholder icon={ icon } label={ label } isColumnLayout={ true }>
				<div
					style={ {
						marginBottom: '12px',
						fontSize: '12px',
						color: '#757575',
						fontStyle: 'italic',
					} }
				>
					{ __( 'This field is invisible to site visitors', 'jetpack-forms' ) }
				</div>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					onChange={ handleLabelChange }
					label={ fieldNameLabel }
					hideLabelFromVision={ true }
					placeholder={ fieldNameLabel }
					value={ attributes.label }
					help={ __(
						'Internal name used to identify this field in form responses',
						'jetpack-forms'
					) }
				/>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					onChange={ handleValueChange }
					label={ valueLabel }
					hideLabelFromVision={ true }
					placeholder={ valueLabel }
					value={ attributes.default }
					help={ __( 'The value that will be submitted with the form', 'jetpack-forms' ) }
					onKeyDown={ onKeyDown }
				/>
			</Placeholder>
		</div>
	);
}
