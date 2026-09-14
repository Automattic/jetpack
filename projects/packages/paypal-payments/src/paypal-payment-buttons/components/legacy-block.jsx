/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The legacy paste-code block.
 *
 * @package
 */

import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * The legacy paste-code block — rendered as-is without the new UI.
 *
 * @param {object}   props               - Component props.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @param {string}   props.colorScheme   - The color scheme attribute.
 * @param {string}   props.buttonText    - The button text attribute.
 * @param {object}   props.blockProps    - The block wrapper props.
 * @return {Element} The legacy block UI.
 */
export default function LegacyBlock( { setAttributes, colorScheme, buttonText, blockProps } ) {
	return (
		<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
			<div className="jetpack-paypal-payment-buttons__legacy">
				<p>
					{ __(
						'This PayPal button uses the legacy paste-code format.',
						'jetpack-paypal-payments'
					) }
				</p>
				<p>
					{ __( 'It will continue to work as-is on the frontend.', 'jetpack-paypal-payments' ) }
				</p>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Button Settings', 'jetpack-paypal-payments' ) }>
					<TextControl
						label={ __( 'Button Text', 'jetpack-paypal-payments' ) }
						value={ buttonText }
						onChange={ value => setAttributes( { buttonText: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}
