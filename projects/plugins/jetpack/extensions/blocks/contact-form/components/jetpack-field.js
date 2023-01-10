import { TextControl, Disabled } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { isEmpty } from 'lodash';
import { useFormStyle } from '../util/form';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

export default function JetpackField( props ) {
	const {
		clientId,
		id,
		isSelected,
		type,
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

	return (
		<>
			<div className={ classes }>
				<JetpackFieldLabel
					label={ label }
					required={ required }
					requiredText={ requiredText }
					setAttributes={ setAttributes }
					style={ formStyle }
				/>
				<Disabled>
					<TextControl
						type={ type }
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
				width={ width }
				setAttributes={ setAttributes }
				placeholder={ placeholder }
			/>
		</>
	);
}

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
