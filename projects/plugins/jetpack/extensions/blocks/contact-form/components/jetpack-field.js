/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { TextControl, Disabled } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldControls from './jetpack-field-controls';

export default function JetpackField( props ) {
	const { id, type, required, label, setAttributes, placeholder, width } = props;

	return (
		<>
			<div className="jetpack-field">
				<JetpackFieldLabel required={ required } label={ label } setAttributes={ setAttributes } />
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
