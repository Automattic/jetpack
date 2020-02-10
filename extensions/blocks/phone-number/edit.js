/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/block-editor';

export default function PhoneNumber( { attributes, setAttributes, className, isSelected } ) {
	const [ label, setLabel ] = useState( attributes.label );

	const saveLabel = event => {
		if ( ! event ) {
			// setErrorNotice();
			return;
		}

		event.preventDefault();

		setAttributes( { label } );
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Phone number Settings', 'jetpack' ) } initialOpen={ false }>
				<form onSubmit={ saveLabel } className={ `${ className }-embed-form-sidebar` }>
					<input
						type="text"
						id="label"
						onChange={ event => setLabel( event.target.value ) }
						placeholder={ __( 'Modify label', 'jetpack' ) }
						value={ label }
						className="components-placeholder__input"
					/>
					<div>
						<Button isSecondary isLarge type="submit">
							{ _x( 'Save', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>
			</PanelBody>
		</InspectorControls>
	);

	if ( isSelected ) {
		return (
			<>
				{ inspectorControls }
				<div className={ className }>
					<span> { label }: </span>
					<PlainText
						value={ attributes.phoneNumber }
						onChange={ phoneNumber => setAttributes( { phoneNumber } ) }
						placeholder={ __( 'Enter phone number' ) }
						aria-label={ __( 'Phone Number' ) }
					/>
				</div>
			</>
		);
	} else {
		const href = `tel:${ attributes.phoneNumber }`;
		return (
			<div className={ className }>
				<span>{ attributes.label }: </span>
				<a href={ href }>{ attributes.phoneNumber }</a>
			</div>
		);
	}
}
