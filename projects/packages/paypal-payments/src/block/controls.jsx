import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Panel controls component for Simple Payments block.
 *
 * @param {object}   props               - Component props
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.postLinkText  - Text to display on the purchase link
 * @return {import('react').JSX.Element} Panel controls component
 */
export function PanelControls( { setAttributes, postLinkText } ) {
	return (
		<PanelBody title={ __( 'Settings', 'jetpack-paypal-payments' ) } initialOpen={ false }>
			<TextControl
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize
				label={ __( 'Purchase link text', 'jetpack-paypal-payments' ) }
				help={ __(
					'Enter the text you want to display on a purchase link used as fallback when the PayPal button cannot be used (e.g. emails, AMP, etc.)',
					'jetpack-paypal-payments'
				) }
				className="jetpack-simple-payments__purchase-link-text"
				placeholder={ __( 'Click here to purchase', 'jetpack-paypal-payments' ) }
				onChange={ newPostLinkText => setAttributes( { postLinkText: newPostLinkText } ) }
				value={ postLinkText }
			/>
		</PanelBody>
	);
}
