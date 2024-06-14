import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { useFormStyle } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackField = props => {
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

	const { blockStyle, fieldStyle } = useJetpackFieldStyles( attributes );
	const formStyle = useFormStyle( clientId );

	const classes = clsx( 'jetpack-field', {
		'is-selected': isSelected,
		'has-placeholder': ! isEmpty( placeholder ),
	} );

	return (
		<>
			<div className={ classes } style={ blockStyle }>
				<JetpackFieldLabel
					attributes={ attributes }
					label={ label }
					required={ required }
					requiredText={ requiredText }
					setAttributes={ setAttributes }
					style={ formStyle }
				/>
				<input
					className="jetpack-field__input"
					onChange={ e => setAttributes( { placeholder: e.target.value } ) }
					style={ fieldStyle }
					type="text"
					value={ placeholder }
				/>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
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
)( JetpackField );

const withCustomClassName = createHigherOrderComponent( BlockListBlock => {
	return props => {
		if ( props.name.indexOf( 'jetpack/field' ) > -1 ) {
			const customClassName = props.attributes.width
				? 'jetpack-field__width-' + props.attributes.width
				: '';

			return <BlockListBlock { ...props } className={ customClassName } />;
		}

		return <BlockListBlock { ...props } />;
	};
}, 'withCustomClassName' );

addFilter( 'editor.BlockListBlock', 'jetpack/contact-form', withCustomClassName );
