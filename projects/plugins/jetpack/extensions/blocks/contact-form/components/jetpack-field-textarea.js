import { useEffect } from '@wordpress/element';
import classnames from 'classnames';
import { isEmpty, isNil } from 'lodash';
import { useFormStyle } from '../util/form';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export default function JetpackFieldTextarea( props ) {
	const {
		attributes,
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
	const { blockStyle, fieldStyle } = useJetpackFieldStyles( attributes );

	const classes = classnames( 'jetpack-field jetpack-field-textarea', {
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
			<div className={ classes } style={ blockStyle }>
				<JetpackFieldLabel
					clientId={ clientId }
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					attributes={ attributes }
					style={ formStyle }
				/>
				<textarea
					className="jetpack-field__textarea"
					value={ placeholder }
					onChange={ e => setAttributes( { placeholder: e.target.value } ) }
					style={ fieldStyle }
				/>
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
