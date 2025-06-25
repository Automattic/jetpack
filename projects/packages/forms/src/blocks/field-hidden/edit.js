import { useBlockProps } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

import './editor.scss';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes } = props;

	const blockProps = useBlockProps();
	blockProps.className += ' jetpack-form-hidden-field__container';

	const handleLabelChange = textValue => {
		setAttributes( { label: textValue } );
	};

	const handleValueChange = textValue => {
		setAttributes( { default: textValue } );
	};

	return (
		<div { ...blockProps }>
			<div className="jetpack-form-hidden-field">
				<div className="jetpack-form-hidden-field__name-container">
					<Icon icon={ unseen } />
					<input
						type="text"
						className="jetpack-form-hidden-field__name jetpack-form-hidden-field__input"
						value={ attributes.label }
						placeholder={ __( 'Hidden input field', 'jetpack-forms' ) }
						onChange={ e => handleLabelChange( e.target.value ) }
						aria-label={ __( 'Field label', 'jetpack-forms' ) }
					/>
				</div>
				<div>
					<input
						type="text"
						className="jetpack-form-hidden-field__value jetpack-form-hidden-field__input"
						placeholder={ __( 'Field value', 'jetpack-forms' ) }
						value={ attributes.default }
						onChange={ e => handleValueChange( e.target.value ) }
						aria-label={ __( 'Field value', 'jetpack-forms' ) }
					/>
				</div>
			</div>
		</div>
	);
}
