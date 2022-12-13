import { TextareaControl, Disabled } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isNil } from 'lodash';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

export default function JetpackFieldTextarea( props ) {
	const { id, required, label, setAttributes, placeholder, width } = props;

	useEffect( () => {
		if ( isNil( label ) ) {
			setAttributes( { label: '' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<>
			<div className="jetpack-field">
				<JetpackFieldLabel required={ required } label={ label } setAttributes={ setAttributes } />
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
