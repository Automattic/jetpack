import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import classnames from 'classnames';
import { isEmpty, noop } from 'lodash';
import { useFormStyle } from '../util/form';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

export default function JetpackField( props ) {
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
				<input
					type="text"
					className="jetpack-field__input"
					value={ placeholder }
					onChange={ noop }
				/>
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
