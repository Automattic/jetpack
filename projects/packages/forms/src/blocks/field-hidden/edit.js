import { useBlockProps } from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

import './editor.scss';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes } = props;
	const { name, value } = attributes;

	const fieldId = useInstanceId( HiddenFieldEdit, 'hidden-field' );

	const blockProps = useBlockProps();
	blockProps.className += ' jetpack-form-hidden-field__container';

	const handleNameChange = textValue => {
		setAttributes( { name: textValue } );
	};

	const handleValueChange = textValue => {
		setAttributes( { value: textValue } );
	};

	return (
		<div { ...blockProps }>
			<div className="jetpack-form-hidden-field">
				<span className="jetpack-form-hidden-field__hint">
					{ __( 'Hidden input field', 'jetpack-forms' ) }
				</span>
				<div>
					<label className="jetpack-form-hidden-field__label" htmlFor={ fieldId + '-name' }>
						{ __( 'Name:', 'jetpack-forms' ) }
					</label>
					<input
						type="text"
						id={ fieldId + '-name' }
						className="jetpack-form-hidden-field__name jetpack-form-hidden-field__input"
						value={ name }
						placeholder={ __( 'Field name', 'jetpack-forms' ) }
						onChange={ e => handleNameChange( e.target.value ) }
						aria-label={ __( 'Field name', 'jetpack-forms' ) }
					/>
				</div>
				<div>
					<label className="jetpack-form-hidden-field__label" htmlFor={ fieldId + '-value' }>
						{ __( 'Value:', 'jetpack-forms' ) }
					</label>
					<input
						type="text"
						id={ fieldId + '-value' }
						className="jetpack-form-hidden-field__value jetpack-form-hidden-field__input"
						placeholder={ __( 'Field value', 'jetpack-forms' ) }
						value={ value }
						onChange={ e => handleValueChange( e.target.value ) }
						aria-label={ __( 'Field value', 'jetpack-forms' ) }
					/>
				</div>
			</div>
		</div>
	);
}
