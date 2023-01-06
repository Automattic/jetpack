import { TextareaControl, Disabled } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isNil } from 'lodash';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export default function JetpackFieldTextarea( props ) {
	const {
		id,
		required,
		requiredText,
		label,
		setAttributes,
		placeholder,
		width,
		attributes,
	} = props;

	useEffect( () => {
		if ( isNil( label ) ) {
			setAttributes( { label: '' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const { blockStyle, fieldStyle } = useJetpackFieldStyles( attributes );

	return (
		<>
			<div style={ blockStyle } className="jetpack-field">
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					attributes={ attributes }
				/>
				<Disabled>
					<TextareaControl
						placeholder={ placeholder }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						title={ __( 'Set the placeholder text', 'jetpack' ) }
						style={ fieldStyle }
					/>
				</Disabled>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				placeholder={ placeholder }
				attributes={ attributes }
			/>
		</>
	);
}
