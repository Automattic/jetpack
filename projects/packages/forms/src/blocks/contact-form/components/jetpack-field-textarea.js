import { compose } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { isEmpty, isNil } from 'lodash';
import { useFormStyle } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackFieldTextarea = props => {
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

	const classes = clsx( 'jetpack-field jetpack-field-textarea', {
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
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackFieldTextarea );
