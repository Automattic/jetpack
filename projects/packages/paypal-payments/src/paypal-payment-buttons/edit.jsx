/**
 * PayPal Payment Buttons — block editor entry point.
 *
 * Picks the paste-code or the API-managed editor from the feature flag PHP
 * puts on the editor state. The two editors are separate components so the
 * API-managed hooks, which call REST routes that only exist while the flag is
 * on, never run for the paste-code path.
 *
 * @package
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PayPalButtonPreview from './components/paypal-button-preview';
import ApiManagedEdit from './edit-api-managed';
import PasteCodeEdit from './edit-paste-code';

/**
 * Name of the flag registered by PayPal_Payment_Buttons::register_feature_flags().
 */
export const API_MANAGED_BUTTONS_FLAG = 'paypal-payments-api-managed-buttons';

/**
 * Read-only view of a button created through the API while the flag is off.
 *
 * The frontend keeps rendering the saved button; the editor just cannot
 * change it until the flag is back on, so say so instead of showing an
 * unrelated paste-code form.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {Element} Read-only preview.
 */
function ApiManagedReadOnly( { attributes } ) {
	const blockProps = useBlockProps();
	const {
		colorScheme,
		productName,
		price,
		currencyCode,
		productDescription,
		paymentLink,
		variantsEnabled,
		variants,
		imageUrl,
	} = attributes;

	return (
		<div { ...blockProps } data-color-scheme={ colorScheme || 'auto' }>
			<Notice status="info" isDismissible={ false }>
				{ __(
					'This button is managed through your PayPal account and cannot be edited right now.',
					'jetpack-paypal-payments'
				) }
			</Notice>
			<div className="jetpack-paypal-payment-buttons__preview">
				<PayPalButtonPreview
					productName={ productName }
					price={ price }
					currencyCode={ currencyCode }
					productDescription={ productDescription }
					paymentLink={ paymentLink }
					variantsEnabled={ variantsEnabled }
					variants={ variants }
					imageUrl={ imageUrl }
				/>
			</div>
		</div>
	);
}

/**
 * PayPal Payment Buttons edit component.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {Element} Block editor UI.
 */
export default function Edit( props ) {
	if ( hasFeatureFlag( API_MANAGED_BUTTONS_FLAG ) ) {
		return <ApiManagedEdit { ...props } />;
	}

	if ( props.attributes.isApiManaged && props.attributes.resourceId ) {
		return <ApiManagedReadOnly attributes={ props.attributes } />;
	}

	return <PasteCodeEdit { ...props } />;
}
