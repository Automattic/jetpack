/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The product creation form.
 *
 * @package
 */

import { Button, Notice, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import FormatSwitcher from './format-switcher';
import VariantBuilder from './variant-builder';

const labelEditHeading = __( 'Edit PayPal Payment Button', 'jetpack-paypal-payments' );
const labelCreateHeading = __( 'Create PayPal Payment Button', 'jetpack-paypal-payments' );

/**
 * The product creation form, shown when PayPal is connected and the block is in edit mode.
 *
 * @param {object}   props                      - Component props.
 * @param {object}   props.attributes           - The full block attributes bag.
 * @param {Function} props.setAttributes        - Function to update block attributes.
 * @param {string}   props.buttonText           - The button label attribute.
 * @param {string}   props.currencyCode         - The currency code attribute.
 * @param {boolean}  props.variantsEnabled      - Whether product options are enabled.
 * @param {object}   props.variants             - The product options attribute.
 * @param {string}   props.activeFormat         - The display format, normalized.
 * @param {boolean}  props.isConnected          - Whether the site is connected to PayPal.
 * @param {string}   props.environment          - 'production' or 'sandbox'.
 * @param {Function} props.setIsEditing         - Setter for the edit/preview toggle.
 * @param {Function} props.setTouchedFields     - Setter for the touched fields.
 * @param {boolean}  props.isFormValid          - Whether the form has no validation errors.
 * @param {boolean}  props.isCreating           - Whether a create or update request is in flight.
 * @param {string}   props.error                - Error message, or null.
 * @param {Function} props.setError             - Setter for the error message.
 * @param {string}   props.successMessage       - Success message, or null.
 * @param {Function} props.setSuccessMessage    - Setter for the success message.
 * @param {Function} props.handleCreateButton   - Create the PayPal payment.
 * @param {Function} props.handleUpdateButton   - Update the PayPal payment.
 * @param {boolean}  props.hasButton            - Whether the block has a created button.
 * @param {Element}  props.disconnectedNotice   - The disconnected warning notice, or null.
 * @param {Element}  props.sharedResourceNotice - The shared-payment info notice, or null.
 * @param {Element}  props.connectionStatus     - The connection status dot.
 * @param {string}   props.connectionLabel      - The connection status label.
 * @return {Element} The product creation form.
 */
export default function ProductForm( {
	attributes,
	setAttributes,
	buttonText,
	currencyCode,
	variantsEnabled,
	variants,
	activeFormat,
	isConnected,
	environment,
	setIsEditing,
	setTouchedFields,
	isFormValid,
	isCreating,
	error,
	setError,
	successMessage,
	setSuccessMessage,
	handleCreateButton,
	handleUpdateButton,
	hasButton,
	disconnectedNotice,
	sharedResourceNotice,
	connectionStatus,
	connectionLabel,
} ) {
	return (
		<div className="jetpack-paypal-payment-buttons__create-form">
			<div className="jetpack-paypal-payment-buttons__preview-status">
				{ connectionStatus }
				{ connectionLabel }
				{ environment === 'sandbox' && (
					<span className="jetpack-paypal-payment-buttons__sandbox-badge">
						{ __( 'Sandbox', 'jetpack-paypal-payments' ) }
					</span>
				) }
			</div>

			{ disconnectedNotice }
			{ sharedResourceNotice }

			<h3>{ hasButton ? labelEditHeading : labelCreateHeading }</h3>
			{ ! hasButton && (
				<p className="jetpack-paypal-payment-buttons__form-intro">
					{ __(
						'Use the button on this page, or share the link anywhere.',
						'jetpack-paypal-payments'
					) }
				</p>
			) }

			{ error && (
				<Notice status="error" isDismissible onDismiss={ () => setError( null ) }>
					{ error }
				</Notice>
			) }

			{ successMessage && (
				<Notice status="success" isDismissible onDismiss={ () => setSuccessMessage( null ) }>
					{ successMessage }
				</Notice>
			) }

			<div className="jetpack-paypal-payment-buttons__variants-section">
				<VariantBuilder
					enabled={ variantsEnabled }
					variants={ variants }
					currencyCode={ currencyCode || 'USD' }
					onChange={ updates => setAttributes( updates ) }
					disabled={ isCreating }
				/>
			</div>

			<div className="jetpack-paypal-payment-buttons__button-appearance">
				<h4 className="jetpack-paypal-payment-buttons__section-heading">
					{ __( 'Button Appearance', 'jetpack-paypal-payments' ) }
				</h4>
				<TextControl
					label={ __( 'Button Text', 'jetpack-paypal-payments' ) }
					value={ buttonText || '' }
					onChange={ value => setAttributes( { buttonText: value } ) }
					disabled={ isCreating }
				/>
				<ToggleControl
					label={ __( 'Show QR code', 'jetpack-paypal-payments' ) }
					help={ __(
						'Display a QR code below the button for in-person sharing.',
						'jetpack-paypal-payments'
					) }
					checked={ attributes.showQrCode !== false }
					onChange={ value => setAttributes( { showQrCode: value } ) }
					disabled={ isCreating }
				/>
			</div>

			<div className="jetpack-paypal-payment-buttons__format-section">
				<h4 className="jetpack-paypal-payment-buttons__section-heading">
					{ __( 'Display Format', 'jetpack-paypal-payments' ) }
				</h4>
				<FormatSwitcher
					value={ activeFormat }
					onChange={ value => setAttributes( { format: value } ) }
					disabled={ isCreating }
				/>
			</div>

			<div className="jetpack-paypal-payment-buttons__form-actions">
				<Button
					variant="primary"
					onClick={ hasButton ? handleUpdateButton : handleCreateButton }
					isBusy={ isCreating }
					disabled={ isCreating || ! isFormValid || ! isConnected }
				>
					{ isCreating && __( 'Saving…', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						hasButton &&
						activeFormat === 'LINK' &&
						__( 'Update Link', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						hasButton &&
						activeFormat === 'QR' &&
						__( 'Update QR Code', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						hasButton &&
						activeFormat === 'BUTTON' &&
						__( 'Update Button', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						! hasButton &&
						activeFormat === 'LINK' &&
						__( 'Create Link', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						! hasButton &&
						activeFormat === 'QR' &&
						__( 'Create QR Code', 'jetpack-paypal-payments' ) }
					{ ! isCreating &&
						! hasButton &&
						activeFormat === 'BUTTON' &&
						__( 'Create Button', 'jetpack-paypal-payments' ) }
				</Button>

				<Button
					variant="tertiary"
					onClick={ () => {
						if ( hasButton ) {
							// Return to preview — discard unsaved edits.
							setIsEditing( false );
							setTouchedFields( {} );
						} else {
							// No saved button yet — reset form fields so merchant can
							// remove the block if they want.
							setAttributes( {
								productName: metadata.attributes.productName.default,
								price: metadata.attributes.price.default,
								currencyCode: metadata.attributes.currencyCode.default,
								productDescription: metadata.attributes.productDescription.default,
								imageUrl: undefined,
								imageId: undefined,
								returnUrl: metadata.attributes.returnUrl.default,
								variantsEnabled: metadata.attributes.variantsEnabled.default,
								variants: undefined,
								adjustableQuantity: metadata.attributes.adjustableQuantity.default,
								maxQuantity: metadata.attributes.maxQuantity.default,
								customerNotes: metadata.attributes.customerNotes.default,
								taxEnabled: metadata.attributes.taxEnabled.default,
								taxType: metadata.attributes.taxType.default,
								taxName: metadata.attributes.taxName.default,
								taxValue: metadata.attributes.taxValue.default,
								buttonText: metadata.attributes.buttonText.default,
								showQrCode: metadata.attributes.showQrCode.default,
							} );
							setTouchedFields( {} );
							setError( null );
						}
					} }
					disabled={ isCreating }
				>
					{ __( 'Cancel', 'jetpack-paypal-payments' ) }
				</Button>
			</div>
		</div>
	);
}
