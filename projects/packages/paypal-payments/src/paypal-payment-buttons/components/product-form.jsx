/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The product creation form.
 *
 * @package
 */

import { Button, Notice, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import metadata from '../block.json';
import FormatSwitcher from './format-switcher';
import VariantBuilder from './variant-builder';

const labelEditHeading = __( 'Edit PayPal Payment Button', 'jetpack-paypal-payments' );
const labelCreateHeading = __( 'Create PayPal Payment Button', 'jetpack-paypal-payments' );
const helpQtyOn = __( 'Customers can buy multiple units at checkout.', 'jetpack-paypal-payments' );
const helpQtyOff = __( 'Fixed at 1 unit per purchase.', 'jetpack-paypal-payments' );
const helpTaxOn = __( 'Tax will be added at PayPal checkout.', 'jetpack-paypal-payments' );
const helpTaxOff = __( 'No tax collected.', 'jetpack-paypal-payments' );

/**
 * The product creation form, shown when PayPal is connected and the block is in edit mode.
 *
 * @param {object}   props                      - Component props.
 * @param {object}   props.attributes           - The full block attributes bag.
 * @param {Function} props.setAttributes        - Function to update block attributes.
 * @param {string}   props.buttonText           - The button label attribute.
 * @param {string}   props.currencyCode         - The currency code attribute.
 * @param {string}   props.returnUrl            - The post-payment return URL attribute.
 * @param {boolean}  props.variantsEnabled      - Whether product options are enabled.
 * @param {object}   props.variants             - The product options attribute.
 * @param {boolean}  props.adjustableQuantity   - Whether customers can adjust quantity.
 * @param {number}   props.maxQuantity          - The maximum quantity attribute.
 * @param {Array}    props.customerNotes        - The custom checkout fields attribute.
 * @param {boolean}  props.taxEnabled           - Whether tax is collected.
 * @param {string}   props.taxType              - The tax type attribute.
 * @param {string}   props.taxName              - The tax name attribute.
 * @param {string}   props.taxValue             - The tax rate attribute.
 * @param {string}   props.activeFormat         - The display format, normalized.
 * @param {boolean}  props.isConnected          - Whether the site is connected to PayPal.
 * @param {string}   props.environment          - 'production' or 'sandbox'.
 * @param {Function} props.setIsEditing         - Setter for the edit/preview toggle.
 * @param {object}   props.touchedFields        - Which fields the merchant has interacted with.
 * @param {Function} props.setTouchedFields     - Setter for the touched fields.
 * @param {Function} props.markTouched          - Mark a field as touched.
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
	returnUrl,
	variantsEnabled,
	variants,
	adjustableQuantity,
	maxQuantity,
	customerNotes,
	taxEnabled,
	taxType,
	taxName,
	taxValue,
	activeFormat,
	isConnected,
	environment,
	setIsEditing,
	touchedFields,
	setTouchedFields,
	markTouched,
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

			<TextControl
				label={ __( 'Return URL (optional)', 'jetpack-paypal-payments' ) }
				value={ returnUrl || '' }
				onChange={ value => setAttributes( { returnUrl: value } ) }
				onBlur={ () => markTouched( 'returnUrl' ) }
				type="url"
				disabled={ isCreating }
				help={
					touchedFields.returnUrl && returnUrl && ! /^https:\/\/.+/.test( returnUrl )
						? __(
								'Return URL must use HTTPS (e.g., https://example.com/thank-you).',
								'jetpack-paypal-payments'
						  )
						: __( 'Redirect customers here after payment.', 'jetpack-paypal-payments' )
				}
				className={
					touchedFields.returnUrl && returnUrl && ! /^https:\/\/.+/.test( returnUrl )
						? 'has-error'
						: undefined
				}
			/>

			<div className="jetpack-paypal-payment-buttons__checkout-options">
				<h4 className="jetpack-paypal-payment-buttons__section-heading">
					{ __( 'Checkout Options', 'jetpack-paypal-payments' ) }
				</h4>

				{ /* WOOPTP-170: Adjustable Quantity */ }
				<ToggleControl
					label={ __( 'Allow customers to adjust quantity', 'jetpack-paypal-payments' ) }
					help={ adjustableQuantity ? helpQtyOn : helpQtyOff }
					checked={ adjustableQuantity }
					onChange={ value => setAttributes( { adjustableQuantity: value } ) }
					disabled={ isCreating }
				/>
				{ adjustableQuantity && (
					<TextControl
						label={ __( 'Maximum quantity', 'jetpack-paypal-payments' ) }
						value={ maxQuantity || '' }
						onChange={ value => setAttributes( { maxQuantity: parseInt( value, 10 ) || 10 } ) }
						type="number"
						min={ 2 }
						max={ 999 }
						disabled={ isCreating }
						help={ __( 'Customers can select from 1 to this number.', 'jetpack-paypal-payments' ) }
					/>
				) }

				{ /* WOOPTP-172: Tax Configuration */ }
				<ToggleControl
					label={ __( 'Collect tax', 'jetpack-paypal-payments' ) }
					help={ taxEnabled ? helpTaxOn : helpTaxOff }
					checked={ taxEnabled }
					onChange={ value => setAttributes( { taxEnabled: value } ) }
					disabled={ isCreating }
				/>
				{ taxEnabled && (
					<div className="jetpack-paypal-payment-buttons__tax-config">
						<SelectControl
							label={ __( 'Tax type', 'jetpack-paypal-payments' ) }
							value={ taxType || 'PERCENTAGE' }
							options={ [
								{
									label: __( 'Fixed percentage', 'jetpack-paypal-payments' ),
									value: 'PERCENTAGE',
								},
								{
									label: __( 'Use PayPal profile settings', 'jetpack-paypal-payments' ),
									value: 'PREFERENCE',
								},
							] }
							onChange={ value => setAttributes( { taxType: value } ) }
							disabled={ isCreating }
						/>
						<TextControl
							label={ __( 'Tax name', 'jetpack-paypal-payments' ) }
							value={ taxName || '' }
							onChange={ value => setAttributes( { taxName: value } ) }
							placeholder={ __( 'Sales Tax', 'jetpack-paypal-payments' ) }
							disabled={ isCreating }
						/>
						{ taxType === 'PERCENTAGE' && (
							<TextControl
								label={ __( 'Tax rate (%)', 'jetpack-paypal-payments' ) }
								value={ taxValue || '' }
								onChange={ value => setAttributes( { taxValue: value } ) }
								type="number"
								min="0.01"
								max="99.99"
								step="0.01"
								placeholder="8.25"
								disabled={ isCreating }
								help={ __( 'Percentage added to the product price.', 'jetpack-paypal-payments' ) }
							/>
						) }
					</div>
				) }

				{ /* WOOPTP-171: Customer Notes */ }
				<ToggleControl
					label={ __( 'Custom checkout fields', 'jetpack-paypal-payments' ) }
					help={
						customerNotes?.length > 0
							? sprintf(
									/* translators: %d: number of custom fields */
									__( '%d custom field(s) configured.', 'jetpack-paypal-payments' ),
									customerNotes.length
							  )
							: __(
									'Add fields for gift messages, personalization, etc.',
									'jetpack-paypal-payments'
							  )
					}
					checked={ customerNotes?.length > 0 }
					onChange={ value => {
						if ( value ) {
							setAttributes( {
								customerNotes: [ { label: '', required: false } ],
							} );
						} else {
							setAttributes( { customerNotes: [] } );
						}
					} }
					disabled={ isCreating }
				/>
				{ customerNotes?.length > 0 && (
					<div className="jetpack-paypal-payment-buttons__customer-notes">
						{ customerNotes.map( ( note, noteIndex ) => (
							<div key={ noteIndex } className="jetpack-paypal-payment-buttons__customer-note">
								<TextControl
									label={ sprintf(
										/* translators: %d: field number */
										__( 'Field %d label', 'jetpack-paypal-payments' ),
										noteIndex + 1
									) }
									value={ note.label || '' }
									onChange={ value => {
										const updated = [ ...customerNotes ];
										updated[ noteIndex ] = {
											...updated[ noteIndex ],
											label: value,
										};
										setAttributes( { customerNotes: updated } );
									} }
									placeholder={ __( 'e.g., Gift Message', 'jetpack-paypal-payments' ) }
									disabled={ isCreating }
								/>
								<div className="jetpack-paypal-payment-buttons__customer-note-controls">
									<ToggleControl
										label={ __( 'Required', 'jetpack-paypal-payments' ) }
										checked={ note.required }
										onChange={ value => {
											const updated = [ ...customerNotes ];
											updated[ noteIndex ] = {
												...updated[ noteIndex ],
												required: value,
											};
											setAttributes( { customerNotes: updated } );
										} }
										disabled={ isCreating }
									/>
									{ customerNotes.length > 1 && (
										<Button
											isSmall
											isDestructive
											variant="tertiary"
											onClick={ () => {
												const updated = customerNotes.filter( ( _, i ) => i !== noteIndex );
												setAttributes( { customerNotes: updated } );
											} }
											disabled={ isCreating }
											aria-label={ sprintf(
												/* translators: %d: field number */
												__( 'Remove field %d', 'jetpack-paypal-payments' ),
												noteIndex + 1
											) }
										>
											{ __( 'Remove', 'jetpack-paypal-payments' ) }
										</Button>
									) }
								</div>
							</div>
						) ) }
						{ customerNotes.length < 5 && (
							<Button
								isSmall
								variant="secondary"
								onClick={ () =>
									setAttributes( {
										customerNotes: [ ...customerNotes, { label: '', required: false } ],
									} )
								}
								disabled={ isCreating }
							>
								{ __( 'Add field', 'jetpack-paypal-payments' ) }
							</Button>
						) }
					</div>
				) }
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
