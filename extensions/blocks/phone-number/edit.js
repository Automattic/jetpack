/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/block-editor';

export default function PhoneNumber( { attributes, setAttributes, className, isSelected } ) {
	if ( isSelected ) {
		return (
			<>
				<div className={ className }>
					<PlainText
						className={ `${ className }-label-input` }
						value={ attributes.label }
						onChange={ label => setAttributes( { label } ) }
						placeholder={ __( 'Phone' ) }
						aria-label={ __( 'Phone Number Label' ) }
					/>
					<PlainText
						className={ `${ className }-number-input` }
						value={ attributes.phoneNumber }
						onChange={ phoneNumber => setAttributes( { phoneNumber } ) }
						placeholder={ __( 'Enter phone number' ) }
						aria-label={ __( 'Phone Number' ) }
					/>
				</div>
			</>
		);
	}

	const href = `tel:${ attributes.phoneNumber }`;
	return (
		<div className={ className }>
			<span>{ attributes.label }</span> <a href={ href }>{ attributes.phoneNumber }</a>
		</div>
	);
}
