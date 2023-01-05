import { TextControl, Disabled } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

export default function JetpackField( props ) {
	const { id, type, required, label, setAttributes, placeholder, width, attributes } = props;

	const blockStyle = {
		backgroundColor: attributes.blockBackgroundColor,
		lineHeight: attributes.lineHeight,
	};

	return (
		<>
			<div className="jetpack-field" style={ blockStyle }>
				<JetpackFieldLabel
					required={ required }
					label={ label }
					setAttributes={ setAttributes }
					attributes={ attributes }
				/>
				<Disabled>
					<TextControl
						type={ type }
						placeholder={ placeholder }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						title={ __( 'Set the placeholder text', 'jetpack' ) }
						style={ {
							borderRadius: attributes.borderRadius,
							borderWidth: attributes.borderWidth,
							lineHeight: attributes.lineHeight,
							borderColor: attributes.borderColor,
							color: attributes.inputColor,
							backgroundColor: attributes.fieldBackgroundColor,
						} }
					/>
				</Disabled>
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
