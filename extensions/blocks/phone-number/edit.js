/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';
/**
 * Internal dependencies
 */
import './editor.scss';

class PhoneNumberEdit extends Component {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	parseNumber = event => {
		// if ( ! event ) {
		// 	setErrorNotice();
		// 	return;
		// }

		event.preventDefault();

		// const newAttributes = getAttributesFromEmbedCode( embedCode );
		// if ( ! newAttributes ) {
		// 	setErrorNotice();
		// 	return;
		// }

		// const newValidatedAttributes = getValidatedAttributes( attributeDetails, newAttributes );

		this.props.setAttributes( 12345 );
	};
	render() {
		return (
			<>
				<form onSubmit={ this.parseNumber }>
					<input
						type="text"
						id="phoneNumber"
						// onChange={ event => setEmbedCode( event.target.value ) }
						placeholder={ __( 'Enter phone number', 'jetpack' ) }
						value=""
						className="components-placeholder__input"
					/>
					<div>
						<Button isSecondary isLarge type="submit">
							{ _x( 'Embed', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>
			</>
		);
	}
}

export default PhoneNumberEdit;
