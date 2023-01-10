import { TextareaControl, Disabled } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { isEmpty, isNil } from 'lodash';
import { useFormStyle } from '../util/form';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

export default function JetpackFieldTextarea( props ) {
	const {
		clientId,
		id,
		isSelected,
		required,
		requiredText,
		label,
		setAttributes,
		placeholder,
		width,
	} = props;
	const formStyle = useFormStyle( clientId );

	const classes = classnames( 'jetpack-field', {
		'is-selected': isSelected,
		'has-placeholder': ! isEmpty( placeholder ),
	} );

	useEffect( () => {
		if ( isNil( label ) ) {
			setAttributes( { label: '' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<>
			<div className={ classes }>
				<JetpackFieldLabel
					clientId={ clientId }
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					style={ formStyle }
				/>
				<Disabled>
					<TextareaControl
						placeholder={ placeholder }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						title={ __( 'Set the placeholder text', 'jetpack' ) }
					/>
				</Disabled>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				placeholder={ placeholder }
			/>
		</>
	);
}
